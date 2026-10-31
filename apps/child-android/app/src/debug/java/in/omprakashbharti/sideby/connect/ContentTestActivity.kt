package `in`.omprakashbharti.sideby.connect

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.Manifest
import android.content.ContentProviderOperation
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.ContactsContract
import android.widget.*

/** Synthetic fixtures only, excluded entirely from the release APK. Never auto-grants permissions. */
class ContentTestActivity:Activity(){
 override fun onCreate(state:Bundle?){super.onCreate(state)
  val body=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(40,100,40,60)};setContentView(body)
  body.addView(TextView(this).apply{text="Synthetic QA tools — debug APK only. Adds one clearly labelled test contact and posts synthetic notifications. Originals are not modified."})
  fun button(text:String,run:()->Unit){body.addView(Button(this).apply{this.text=text;setOnClickListener{run()}})}
  button("Request fixture permissions") {requestPermissions(arrayOf(Manifest.permission.WRITE_CONTACTS,Manifest.permission.POST_NOTIFICATIONS),80)}
  button("Add synthetic contact") {
   if(checkSelfPermission(Manifest.permission.WRITE_CONTACTS)!=PackageManager.PERMISSION_GRANTED){Toast.makeText(this,"Allow fixture contact permission first",Toast.LENGTH_LONG).show();return@button}
   val ops=arrayListOf(
    ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI).withValue("account_type",null).withValue("account_name",null).build(),
    ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI).withValueBackReference("raw_contact_id",0).withValue("mimetype",ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE).withValue("data1","Sideby Synthetic Contact").build(),
    ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI).withValueBackReference("raw_contact_id",0).withValue("mimetype",ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE).withValue("data1","+15550101000").withValue("data2",2).build())
   contentResolver.applyBatch(ContactsContract.AUTHORITY,ops);Toast.makeText(this,"Synthetic contact created",Toast.LENGTH_LONG).show()
  }
  button("Post synthetic previews in 5 seconds") {
   val manager=getSystemService(NotificationManager::class.java);manager.createNotificationChannel(NotificationChannel("synthetic_qa","Synthetic QA",NotificationManager.IMPORTANCE_DEFAULT))
   startActivity(Intent(this,SharingActivity::class.java))
   Handler(Looper.getMainLooper()).postDelayed({
    manager.notify(9901,Notification.Builder(this,"synthetic_qa").setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle("Sideby synthetic preview").setContentText("Meet at the park").setVisibility(Notification.VISIBILITY_PUBLIC).build())
    manager.notify(9902,Notification.Builder(this,"synthetic_qa").setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle("Synthetic verification").setContentText("Verification code 123456").setVisibility(Notification.VISIBILITY_PRIVATE).build())
   },5000)
  }
 }
}
