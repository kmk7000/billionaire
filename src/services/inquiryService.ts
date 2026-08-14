// 1:1 support inquiries.
//
// There is no Cloud Storage bucket in this project, so screenshots are stored
// as data URLs. Firestore caps a document at 1MB, so each screenshot goes in
// its own document under an `attachments` subcollection instead of being
// packed into the inquiry itself.

import { collection, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export const MAX_INQUIRY_ATTACHMENTS = 5;

export interface InquiryInput {
  userId: string;
  email: string;
  body: string;
  /** Screenshot data URLs, already resized by the caller. */
  attachments: string[];
}

export async function submitInquiry({ userId, email, body, attachments }: InquiryInput): Promise<string> {
  try {
    const inquiryRef = await addDoc(collection(db, 'inquiries'), {
      userId,
      email,
      body,
      attachmentCount: attachments.length,
      status: 'open',
      createdAt: serverTimestamp(),
    });

    // Written after the parent so the attachment rules can look the inquiry up.
    await Promise.all(
      attachments.map((dataUrl, index) =>
        setDoc(doc(db, 'inquiries', inquiryRef.id, 'attachments', String(index)), {
          dataUrl,
          order: index,
          createdAt: serverTimestamp(),
        })
      )
    );

    return inquiryRef.id;
  } catch (error) {
    handleFirestoreError(error as Error, OperationType.CREATE, 'inquiries');
    throw error;
  }
}
