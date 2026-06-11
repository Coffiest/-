import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Transcription {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
}

export interface UserProfile {
  saveCount: number;
  isPaid: boolean;
}

export const FREE_SAVES_LIMIT = 1;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            `タイムアウト（${ms / 1000}秒）: Firestoreに接続できません。Firebase ConsoleでFirestore Databaseが作成・有効になっているか確認してください。`
          )
        ),
      ms
    )
  );
  return Promise.race([promise, timeout]);
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const snap = await withTimeout(getDoc(doc(db, "users", userId)), 10000);
    if (!snap.exists()) return { saveCount: 0, isPaid: false };
    const data = snap.data();
    return {
      saveCount: (data.saveCount as number) ?? 0,
      isPaid: (data.isPaid as boolean) ?? false,
    };
  } catch {
    return { saveCount: 0, isPaid: false };
  }
}

export async function markUserAsPaid(userId: string): Promise<void> {
  await withTimeout(
    setDoc(doc(db, "users", userId), { isPaid: true }, { merge: true }),
    10000
  );
}

export async function saveTranscription(
  userId: string,
  text: string
): Promise<string> {
  if (!userId) throw new Error("userId is empty");
  const ref = await withTimeout(
    addDoc(collection(db, "users", userId, "transcriptions"), {
      text,
      createdAt: serverTimestamp(),
      userId,
    }),
    10000
  );
  // Track save count (fire-and-forget; rule errors are non-fatal)
  setDoc(doc(db, "users", userId), { saveCount: increment(1) }, { merge: true }).catch(
    () => {}
  );
  return ref.id;
}

export async function getTranscriptions(
  userId: string
): Promise<Transcription[]> {
  const q = query(
    collection(db, "users", userId, "transcriptions"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await withTimeout(getDocs(q), 10000);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      text: data.text as string,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      userId: data.userId as string,
    };
  });
}

export async function deleteTranscription(
  userId: string,
  transcriptionId: string
): Promise<void> {
  await withTimeout(
    deleteDoc(doc(db, "users", userId, "transcriptions", transcriptionId)),
    10000
  );
}
