import { supabase } from "./supabase";

const ONESIGNAL_APP_ID = "d6a0d4c7-af80-4323-b9e4-dcdc447d7cde";
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

interface NotificationPayload {
  patientId: string;
  doctorId?: string;
  title: string;
  message: string;
}

/**
 * Universal Notification Dispatcher
 * 1. Inserts record into Supabase `notifications` table for the in-app Bell icon history.
 * 2. Calls OneSignal REST API to trigger a lock-screen push notification on the patient's phone.
 */
export async function sendNotificationToPatient({
  patientId,
  doctorId,
  title,
  message,
}: NotificationPayload) {
  try {
    // 1. Store in Supabase for In-App Notification Center
    const { error: dbError } = await supabase.from("notifications").insert({
      patient_id: patientId,
      doctor_id: doctorId,
      title,
      message,
      type: "alert",
      is_read: false,
    });

    if (dbError) {
      console.error("Supabase Notification Error:", dbError);
    }

    // 2. Trigger Lock-Screen Alert via OneSignal REST API
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: {
          external_id: [patientId],
        },
        target_channel: "push",
        headings: { en: title },
        contents: { en: message },
        data: { targetScreen: "notifications" },
      }),
    });

    const result = await response.json();
    console.log("OneSignal Push Dispatch Result:", result);
  } catch (err) {
    console.error("Error dispatching notification:", err);
  }
} 