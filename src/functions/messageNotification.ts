import admin from 'firebase-admin';
import { Expo } from 'expo-server-sdk';
import functions from 'firebase-functions';

// 1. usersからtokenを取ってくる。そのために、userIdを取得する必要あり。2. messageになにか追加される→そのroomIdを取得→そのroomIdと同じroomsの中にいるユーザーにだけpush通知を送る。(できるのか？)
export const messageNotification = () => {
  let messages = [];
  const expo = new Expo();
  admin.initializeApp();

  console.log('hi')
  const usersRef = admin.firestore().collection('users')
  
  exports.myfunc = functions.firestore
    .document('messages')
    .onCreate((snap, context) => {
      const value = snap.data();
      const name = value.user.name;
      console.log(name);
    })

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
}
