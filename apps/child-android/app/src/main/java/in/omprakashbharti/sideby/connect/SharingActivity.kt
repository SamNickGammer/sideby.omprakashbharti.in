package `in`.omprakashbharti.sideby.connect

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.provider.Settings
import android.view.WindowManager
import android.widget.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.UUID
import java.util.concurrent.Executors

class SharingActivity:Activity() {
    private val executor=Executors.newSingleThreadExecutor()
    private var busy=false
    private var note="Review your sharing choices below. New categories start off."
    private var selected:Bitmap?=null
    private lateinit var body:LinearLayout
    private fun session()=try{SecureSession(this).load()}catch(_:Exception){null}
    private fun dp(n:Int)=(n*resources.displayMetrics.density).toInt()
    override fun onCreate(state:Bundle?){super.onCreate(state);if(!BuildConfig.DEBUG)window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)}
    override fun onResume(){super.onResume();PreviewBuffer.screenVisible=true;render()}
    override fun onPause(){PreviewBuffer.screenVisible=false;super.onPause()}
    override fun onDestroy(){executor.shutdownNow();selected?.recycle();super.onDestroy()}
    private fun label(value:String,size:Float=15f) {body.addView(TextView(this).apply{text=value;textSize=size;setTextColor(Color.rgb(24,61,56));setPadding(0,dp(10),0,dp(10))})}
    private fun button(value:String,action:()->Unit){body.addView(Button(this).apply{text=value;isAllCaps=false;isEnabled=!busy;setOnClickListener{action()}},LinearLayout.LayoutParams(-1,-2))}
    private fun render(){
        val scroll=ScrollView(this).apply{setBackgroundColor(Color.rgb(251,252,248))}
        body=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(24),dp(48),dp(24),dp(48))};scroll.addView(body);setContentView(scroll)
        button("Back to connection"){finish()};label("Your shared data",28f);label(note)
        val s=session()
        if(s?.connected!=true){label("Pair and get parent approval first.");return}
        label("Your parent can see only the categories you enable. Updates are sent while Sideby is open. Stop clears the server on the next successful sync; offline changes remain pending.")
        button("Sync shared data now"){sync()}
        for((kind,name) in ContentSharing.labels){
            val on=ContentSharing.enabled(this,s,kind); val granted=ContentSharing.granted(this,kind)
            label("$name · ${if(on) "SHARING ON" else "OFF"}",20f)
            label(when(kind){
                "apps"->"Names, package IDs and versions of launcher-visible apps. Android may hide system or work-profile apps."
                "notifications"->"Previews only from selected apps, collected while this screen is visible. Private and code-like content is withheld. Not full conversations."
                "contacts"->"Up to 200 contact name/phone-number rows. No emails, addresses, notes or contact photos."
                "sms"->"Up to 100 SMS from the last seven days. Android/installer restrictions may make this unavailable. Code-like messages are withheld."
                else->"Up to 100 call records from the last seven days: number, time, direction and duration. No recordings. Android may refuse access."
            })
            if(kind!="apps"){
                label(if(granted)"Android access: allowed" else "Android access: not allowed")
                button(if(kind=="notifications")"Manage notification access" else "Request $name permission"){
                    if(kind=="notifications")startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                    else ContentSharing.permissions[kind]?.let{requestPermissions(arrayOf(it),52)}
                }
            }
            if(kind=="notifications")button("Choose notification sources (${ContentSharing.sources(this,s).size})"){
                val apps=ContentSharing.visibleApps(this);val choices=apps.map{packageManager.getApplicationLabel(it).toString()}.toTypedArray()
                val chosen=ContentSharing.sources(this,s).toMutableSet()
                AlertDialog.Builder(this).setTitle("Only selected apps may share previews").setMultiChoiceItems(choices,apps.map{it.packageName in chosen}.toBooleanArray()){_,which,checked->if(checked)chosen.add(apps[which].packageName)else chosen.remove(apps[which].packageName)}
                    .setNegativeButton("Cancel",null).setPositiveButton("Save sources"){_,_->ContentSharing.setSources(this,s,chosen);sync("notifications")}.show()
            }
            button(if(on)"Stop sharing $name" else "Enable $name sharing"){
                AlertDialog.Builder(this).setTitle(if(on)"Stop sharing $name?" else "Share $name with your paired parent?")
                    .setMessage(if(on)"Local collection stops. The saved parent snapshot is cleared on the next successful sync." else "Your paired parent will receive the fields described above. Android access is also required where shown. You can stop and clear sharing here at any time.")
                    .setNegativeButton("Cancel",null).setPositiveButton(if(on)"Stop" else "Enable"){_,_->ContentSharing.setEnabled(this,s,kind,!on);sync(kind)}.show()
            }
        }
        label("Selected photos",20f);label("Only a photo you pick and confirm is uploaded. No access to the rest of your gallery. Sharing a new photo replaces the previously shared selection.")
        button("Choose a photo"){
            val intent=if(Build.VERSION.SDK_INT>=33)Intent(MediaStore.ACTION_PICK_IMAGES).setType("image/*") else Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE)
            startActivityForResult(intent,53)
        }
        selected?.let{bitmap->
            body.addView(ImageView(this).apply{setImageBitmap(bitmap);adjustViewBounds=true;contentDescription="Selected photo preview"},LinearLayout.LayoutParams(-1,dp(220)))
            button("Share this selected photo") {runTask{
                val out=ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.JPEG,80,out)
                require(out.size()<=600*1024){"Image is too large. Choose a smaller image."}
                val item=JSONObject().put("id",UUID.randomUUID().toString()).put("image",android.util.Base64.encodeToString(out.toByteArray(),android.util.Base64.NO_WRAP))
                PairingApi().reportContent(s,"photos",ContentSharing.report("ready",JSONArray().put(item)))
                "Selected photo shared. Open Photo gallery in the parent dashboard."
            }}
            button("Cancel photo selection"){selected?.recycle();selected=null;render()}
        }
        button("Clear shared photos"){AlertDialog.Builder(this).setTitle("Clear shared photos?").setMessage("Removes this device's shared gallery on the next successful request. Original phone photos are unchanged.").setNegativeButton("Cancel",null).setPositiveButton("Clear"){_,_->runTask{PairingApi().reportContent(s,"photos",ContentSharing.report("disabled"));"Shared photos cleared."}}.show()}
    }
    private fun sync(kind:String?=null){val s=session()?:return;runTask{val api=PairingApi();api.reportPermissions(s,PermissionSnapshot.report(this));ContentSharing.sync(this,s,api,kind)}}
    private fun runTask(task:()->String){if(busy)return;busy=true;note="Syncing…";render();executor.execute{
        val result=try{task()}catch(_:Exception){"Could not sync. Changes may be pending; retry while connected."}
        runOnUiThread{if(!isDestroyed&&!isFinishing){busy=false;note=result;render()}}
    }}
    override fun onRequestPermissionsResult(request:Int,permissions:Array<out String>,results:IntArray){super.onRequestPermissionsResult(request,permissions,results);note="Android access updated. If permission was refused, this feature remains unavailable. Enable sharing separately.";sync()}
    @Deprecated("Activity result compatibility for API 26")
    override fun onActivityResult(request:Int,result:Int,data:Intent?){super.onActivityResult(request,result,data)
        if(request!=53||result!=RESULT_OK)return
        val uri=data?.data?:return
        runTask{
            val bitmap=if(Build.VERSION.SDK_INT>=28)ImageDecoder.decodeBitmap(ImageDecoder.createSource(contentResolver,uri)){decoder,info,_->
                require(info.size.width.toLong()*info.size.height<=16000000){"Image is too large"}
                val scale=minOf(1.0,1000.0/maxOf(info.size.width,info.size.height));decoder.setTargetSize(maxOf(1,(info.size.width*scale).toInt()),maxOf(1,(info.size.height*scale).toInt()))
            }else{
                val bytes=contentResolver.openInputStream(uri)!!.use{input->input.readNBytesCompat(12*1024*1024)}
                val options=BitmapFactory.Options().apply{inJustDecodeBounds=true};BitmapFactory.decodeByteArray(bytes,0,bytes.size,options)
                require(options.outWidth.toLong()*options.outHeight in 1..16000000)
                options.inSampleSize=maxOf(1,maxOf(options.outWidth,options.outHeight)/1000);options.inJustDecodeBounds=false
                BitmapFactory.decodeByteArray(bytes,0,bytes.size,options)?:error("Invalid image")
            }
            selected?.recycle();selected=bitmap;"Photo selected. Review it, then tap Share this selected photo."
        }
    }
}
private fun java.io.InputStream.readNBytesCompat(limit:Int):ByteArray {val out=ByteArrayOutputStream();val buffer=ByteArray(8192);while(true){val n=read(buffer);if(n<0)break;require(out.size()+n<=limit);out.write(buffer,0,n)};return out.toByteArray()}
