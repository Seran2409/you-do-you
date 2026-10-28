package expo.modules.dndcontrol

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Switches Android's Do Not Disturb mode for a meditation session and back.
 * The user grants "Do Not Disturb access" once in the system settings; without it nothing changes.
 */
class DndControlModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val notificationManager: NotificationManager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  override fun definition() = ModuleDefinition {
    Name("DndControl")

    Function("hasAccess") {
      notificationManager.isNotificationPolicyAccessGranted
    }

    Function("openAccessSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("getFilter") {
      notificationManager.currentInterruptionFilter
    }

    Function("setFilter") { filter: Int ->
      if (notificationManager.isNotificationPolicyAccessGranted) {
        notificationManager.setInterruptionFilter(filter)
        true
      } else {
        false
      }
    }
  }
}
