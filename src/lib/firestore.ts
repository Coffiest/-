import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Transcription {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
}

export async function saveTranscription(
  userId: string,
  text: string
): Promise<string> {
  if (!userId) throw new Error("userId is empty");
  const ref = await addDoc(
    collection(db, "users", userId, "transcriptions"),
    { text, createdAt: serverTimestamp(), userId }
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
  const snapshot = await getDocs(q);
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
  await deleteDoc(doc(db, "users", userId, "transcriptions", transcriptionId));
}
