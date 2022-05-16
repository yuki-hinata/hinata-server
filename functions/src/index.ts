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
      // const fetchToken = async () => {
      //   const exceptSenderIds = getUserIds[0].filter((id: any) => id !== userId);
      //   for (let i = 0; i < exceptSenderIds.length; i++) {
      //     const userId = exceptSenderIds[i];
      //     const doc = await usersRef.doc(userId);
      //     const token = await (await doc.get()).data()?.expoPushToken;
      //     return token;
      //   }
      // };
      // iが２になる瞬間、配列の長さが３ではないので、undefinedになる→エラーが起きる。だから、
      for (let i = 0; i < getUserIds[0].length; i++) {
        const checkUsers = getUserIds[0][i].includes(userId);
        if (!checkUsers) {
          const messages: ExpoPushMessage[] = [];
          for (let i = 0; i < getUserIds[0].length; i++) {
            const exceptSenderIds = getUserIds[0].filter((id: any) => id !== userId);
            const userIds = exceptSenderIds[i];
            if (userIds === undefined) {
              return;
            }
            const doc = await usersRef.doc(userIds);
            const token = await (await doc.get()).data()?.expoPushToken;
            console.log(token);
            messages.push({
              to: token,
              title: userNickname,
              body: sendText,
            });
          }
          try {
            await expo.sendPushNotificationsAsync(messages);
          } catch (error) {
            console.error(error);
          }
        }
      }
    });
