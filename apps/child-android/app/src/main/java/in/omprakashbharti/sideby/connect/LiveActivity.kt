package `in`.omprakashbharti.sideby.connect

import android.Manifest
import android.app.*
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.*
import io.livekit.android.LiveKit
import io.livekit.android.room.Room
import io.livekit.android.room.track.*
import io.livekit.android.room.track.screencapture.ScreenCaptureParams
import kotlinx.coroutines.*
import org.json.JSONObject

/** Visible, per-session authorization. No boot receiver or background capture trigger. */
class LiveActivity:Activity(){
 private val scope=CoroutineScope(SupervisorJob()+Dispatchers.Main.immediate)
 private var connection:Session?=null
 private var request:JSONObject?=null
 private var room:Room?=null
 private var visible=false
 private var starting=false
 private var approved=false
 private var sharing=false
 private var ended=false
 private var actualLens:String?=null
 private var switching=false
 private var deadline=0L
 private var localLease=0L
 private var message="Ask your parent to press Start in the dashboard. Keep this screen open to receive the request."
 private lateinit var body:LinearLayout
 private lateinit var status:TextView
 private lateinit var approve:Button
 private lateinit var decline:Button
 private lateinit var stop:Button
 private var pollJob:Job?=null
 private var startJob:Job?=null
 override fun onCreate(state:Bundle?){
  super.onCreate(state)
  connection=try{SecureSession(this).load()}catch(_:Exception){null}
  val scroll=ScrollView(this);body=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(36,36,36,36);setBackgroundColor(Color.rgb(251,252,248))};scroll.addView(body);setContentView(scroll)
  scroll.setOnApplyWindowInsetsListener{v,i->if(Build.VERSION.SDK_INT>=30){val b=i.getInsets(android.view.WindowInsets.Type.systemBars());v.setPadding(b.left,b.top,b.right,b.bottom)};i}
  fun label(text:String,size:Float)=TextView(this).apply{this.text=text;textSize=size;setTextColor(Color.rgb(24,61,56));setPadding(0,16,0,16);body.addView(this)}
  label("Live sharing",28f);label("Your choice, every time",18f)
  label("Your parent can request one live screen, camera or microphone session. Nothing starts until you accept. Screen and camera never include microphone audio. Sharing ends after five minutes. No recording or remote control.",16f)
  status=label(message,18f)
  fun button(text:String,click:()->Unit)=Button(this).apply{this.text=text;isAllCaps=false;body.addView(this,LinearLayout.LayoutParams(-1,-2));setOnClickListener{click()}}
  approve=button("Review and allow this session"){review()}
  decline=button("Decline request"){finishSession("Request declined.","decline")}
  stop=button("Stop sharing"){finishSession("Sharing stopped.")}
  label("Camera and microphone stop if you leave this screen. Screen sharing may continue while you use other apps, with a visible Android notification and Stop sharing action. Android may hide protected content.",14f)
  render()
  scope.launch{while(isActive){delay(1000);if(sharing&&(android.os.SystemClock.elapsedRealtime()>deadline||android.os.SystemClock.elapsedRealtime()>localLease))finishSession("Session ended: connection or time limit.")}}
  if(intent.action=="STOP_LIVE")finishSession("Sharing stopped.")
 }
 override fun onStart(){super.onStart();visible=true;if(pollJob?.isActive!=true)pollJob=scope.launch{while(isActive){if(!starting&&(visible||sharing))poll();delay(5000)}}}
 override fun onStop(){visible=false;if((sharing||starting)&&request?.optString("kind")!="screen")finishSession("Sharing stopped because you left the live-sharing screen.");super.onStop()}
 override fun onDestroy(){finishSession("Sharing stopped.");scope.cancel();super.onDestroy()}
 override fun onNewIntent(intent:Intent){super.onNewIntent(intent);if(intent.action=="STOP_LIVE")finishSession("Sharing stopped.")}
 private fun render(){status.text=message;approve.visibility=if(request?.optString("status")=="pending"&&!starting&&!sharing)View.VISIBLE else View.GONE;decline.visibility=approve.visibility;stop.visibility=if(sharing||starting)View.VISIBLE else View.GONE}
 private suspend fun api(id:String?=null,action:String="poll",lens:String?=null):JSONObject=withContext(Dispatchers.IO){PairingApi().live(connection?:error("Not paired"),id,action,lens)}
 private suspend fun poll(){
  try{
   if(sharing){
    val r=room?:return;val kind=request!!.getString("kind")
    if(kind=="camera"&&checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED)error("Permission revoked")
    if(kind=="audio"&&checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED)error("Permission revoked")
    val track=r.localParticipant.getTrackPublication(Track.Source.CAMERA)?.track as? LocalVideoTrack
    val actual=if(kind=="camera")actualLens else null
    val v=api(request!!.getString("id"),"pulse",actual).getJSONObject("session")
    if(v.getString("status")!in listOf("approved","active")){finishSession("Session ended by your parent or the server.");return}
    localLease=android.os.SystemClock.elapsedRealtime()+15000
    val desired=v.getString("desired_lens")
    if(kind=="camera"&&desired!=actual&&!switching&&track!=null)switchLens(track,desired)
    request=v;message="Sharing ${kind.uppercase()} with your parent. You can stop at any time.";render()
   }else{
    val next=api().optJSONObject("session");if(!visible)return
    if(next?.optString("status")=="pending"){request=next;ended=false;message="Your parent requests ${next.getString("kind").uppercase()} sharing${if(next.getString("kind")=="camera")" (${next.getString("desired_lens")} camera)" else ""}. Review before allowing.";render()}
    else if(request?.optString("status")=="pending"){request=null;message="Request expired or was cancelled.";render()}
   }
  }catch(_:CancellationException){throw CancellationException()}
  catch(_:Exception){if(sharing)finishSession("Sharing stopped: connection unavailable.")else{message="Live service unavailable. Check your connection; no media is being shared.";render()}}
 }
 private fun cameraDevice(lens:String):String {
  val e=livekit.org.webrtc.Camera2Enumerator(this)
  return e.deviceNames.firstOrNull { if(lens=="front")e.isFrontFacing(it) else e.isBackFacing(it) }?:error("Requested camera unavailable")
 }
 private fun switchLens(track:LocalVideoTrack,lens:String){
  val camera=track.capturer as? livekit.org.webrtc.CameraVideoCapturer?:error("Camera cannot switch")
  val target=cameraDevice(lens);val sessionId=request?.optString("id");switching=true
  camera.switchCamera(object:livekit.org.webrtc.CameraVideoCapturer.CameraSwitchHandler {
   override fun onCameraSwitchDone(front:Boolean){scope.launch{if(request?.optString("id")==sessionId){actualLens=if(front)"front" else "back";switching=false;track.options=track.options.copy(deviceId=target,position=if(front)CameraPosition.FRONT else CameraPosition.BACK)}}}
   override fun onCameraSwitchError(description:String?){scope.launch{if(request?.optString("id")==sessionId)finishSession("Requested camera is unavailable. Sharing stopped.")}}
  },target)
 }
 private fun review(){
  if(starting||sharing||!visible)return
  val kind=request?.optString("kind")?:return
  starting=true;render()
  AlertDialog.Builder(this).setTitle("Share $kind with your parent?").setMessage("This is a live, view-only session lasting up to five minutes. You can stop whenever you want. ${if(kind=="screen")"Android will ask which screen or app to share. Notifications and private content on the shared screen may be visible." else "Stay on this screen while sharing."}")
   .setOnCancelListener{starting=false;render()}.setNegativeButton("Not now"){_,_->starting=false;render()}.setPositiveButton("Continue"){_,_->starting=true;approved=true;render();permissions()}.show()
 }
 private fun permissions(){
  val kind=request?.optString("kind")?:return
  val permission=when(kind){"camera"->Manifest.permission.CAMERA;"audio"->Manifest.permission.RECORD_AUDIO;else->if(Build.VERSION.SDK_INT>=33)Manifest.permission.POST_NOTIFICATIONS else null}
  if(permission!=null&&checkSelfPermission(permission)!=PackageManager.PERMISSION_GRANTED){requestPermissions(arrayOf(permission),610);return}
  if(kind=="screen"){
   if(!getSystemService(NotificationManager::class.java).areNotificationsEnabled()){finishSession("Enable Sideby notifications first so screen sharing stays visible.","decline");return}
   startActivityForResult(getSystemService(MediaProjectionManager::class.java).createScreenCaptureIntent(),611)
  }else begin(null)
 }
 override fun onRequestPermissionsResult(code:Int,permissions:Array<out String>,results:IntArray){super.onRequestPermissionsResult(code,permissions,results);if(code==610){if(results.isNotEmpty()&&results.all{it==PackageManager.PERMISSION_GRANTED})permissions()else finishSession("Permission was not granted. No media shared.","decline")}}
 override fun onActivityResult(code:Int,result:Int,data:Intent?){super.onActivityResult(code,result,data);if(code==611){if(result==RESULT_OK&&data!=null&&approved)begin(data)else finishSession("Screen sharing was not approved.","decline")}}
 private fun screenNotification():Notification{
  val manager=getSystemService(NotificationManager::class.java);manager.createNotificationChannel(NotificationChannel("sideby_live","Live screen sharing",NotificationManager.IMPORTANCE_LOW))
  val stopIntent=Intent(this,LiveActivity::class.java).setAction("STOP_LIVE").addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
  val stopAction=PendingIntent.getActivity(this,611,stopIntent,PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  val open=PendingIntent.getActivity(this,612,Intent(this,LiveActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  return Notification.Builder(this,"sideby_live").setSmallIcon(R.drawable.ic_sideby).setContentTitle("Sideby: screen sharing is active").setContentText("Your parent can see your shared screen. Tap Stop sharing to end.").setOngoing(true).setContentIntent(open).addAction(Notification.Action.Builder(null,"Stop sharing",stopAction).build()).build()
 }
 private fun begin(projection:Intent?){
  if(!approved||ended)return
  startJob=scope.launch{
   try{
    val s=request?:error("No request");val id=s.getString("id");val kind=s.getString("kind")
    if(kind!="screen"&&!visible)error("Not visible")
    api(id,"approve");withContext(Dispatchers.IO){PairingApi().reportPermissions(connection!!,PermissionSnapshot.report(this@LiveActivity))};val grant=api(id,"join");ensureActive()
    val r=LiveKit.create(applicationContext);room=r
    r.videoTrackCaptureDefaults=LocalVideoTrackOptions(deviceId=if(kind=="camera")cameraDevice(s.getString("desired_lens")) else null,position=if(s.getString("desired_lens")=="back")CameraPosition.BACK else CameraPosition.FRONT,captureParams=VideoCaptureParameter(640,480,15))
    // LiveKit uses (0, 0) to follow real display dimensions, including rotation.
    // A fixed 16:9 capture makes Android letterbox tall phone screens inside the video.
    r.screenShareTrackCaptureDefaults=LocalVideoTrackOptions(isScreencast=true,captureParams=VideoCaptureParameter(0,0,10))
    r.connect(grant.getString("url"),grant.getString("token"));ensureActive()
    if(ended||(!visible&&kind!="screen"))error("Session stopped")
    val success=when(kind){"screen"->r.localParticipant.setScreenShareEnabled(true,ScreenCaptureParams(projection?:error("Missing system approval"),620,screenNotification(),onStop={scope.launch{if(request?.optString("id")==id)finishSession("Screen sharing stopped by Android.")}}));"camera"->r.localParticipant.setCameraEnabled(true);else->r.localParticipant.setMicrophoneEnabled(true)}
    check(success);actualLens=if(kind=="camera")s.getString("desired_lens") else null;sharing=true;starting=false;deadline=android.os.SystemClock.elapsedRealtime()+5*60*1000;localLease=android.os.SystemClock.elapsedRealtime()+15000
    message="Sharing ${kind.uppercase()} with your parent. You can stop at any time.";render();poll()
   }catch(_:CancellationException){throw CancellationException()}
   catch(_:Exception){finishSession("Could not start sharing. No media remains active.")}
  }
 }
 private fun finishSession(text:String,action:String="stop"){
  val id=request?.optString("id");ended=true;starting=false;approved=false;sharing=false;switching=false;actualLens=null
  startJob?.cancel();startJob=null
  val r=room;room=null;r?.disconnect();r?.release()
  request=null;message=text;if(::status.isInitialized)render()
  if(id!=null)scope.launch(Dispatchers.IO){try{PairingApi().live(connection?:return@launch,id,action)}catch(_:Exception){/* Server lease expires even if stop cannot be delivered. */}}
 }
}
