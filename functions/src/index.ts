/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import type {ExpoPushMessage} from "expo-server-sdk";
import {Expo} from "expo-server-sdk";

admin.initializeApp();
const expo = new Expo();
exports.messageNotification = functions.region("asia-northeast1").firestore
    .document("messages/{messagesId}")
    .onCreate(async (snap) => {
      const messages = snap.data();
      // messageを送ったユーザー。
      const userId: string = messages.user._id;
      const userNickname: string = messages.user.name;
      const sendText: string = messages.text;

      const roomsRef = admin.firestore().collection("Rooms");
      const usersRef = admin.firestore().collection("users");
      // 多次元配列になってしまっているので、取り出し方に注意。
      const getUserIds = await roomsRef.where("userIds", "array-contains", userId).get().then((room) => {
        const docsUserIds = room.docs.map((doc) => {
          const userIds = doc.data().userIds;
          return userIds;
        });
        return docsUserIds;
      }).catch((err) => console.error(err));
      if (!getUserIds || getUserIds[0].length === 1) {
        return;
      }
      // 二次元配列→一次元配列
      const allRoomUser = getUserIds.flat();
      console.log(allRoomUser);
      // 一回回るときになぜ２回もtokenがコンソール表示されるのか？→内部のfor文が２回回る→外のfor文が２回回るで４回表示される。これ絶対いい方法がありそう。
      const exceptSenderIds = allRoomUser.filter((id: any) => id !== userId);

      const pushMessages: ExpoPushMessage[] = [];
      for (let i = 0; i < exceptSenderIds.length; i++) {
        const userIds = exceptSenderIds[i];
        console.log(userIds);
        console.log(exceptSenderIds);
        if (userIds === undefined) {
          console.log(userIds);
          return;
        }
        const doc = await usersRef.doc(userIds);
        const token = (await doc.get()).data()?.expoPushToken;
        console.log(token);
        pushMessages.push({
          to: token,
          title: userNickname,
          body: sendText,
        });
      }
      try {
        await expo.sendPushNotificationsAsync(pushMessages);
      } catch (error) {
        console.error(error);
      }
    });
