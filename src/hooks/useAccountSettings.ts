import { useState } from 'react';
import {
  signOut,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, EmailAuthProvider, handleFirestoreError, OperationType } from '../firebase';
import { useToast } from '../components/Toast';
import type { Tab } from '../types/app';

export function useAccountSettings(user: FirebaseUser | null, setActiveTab: (tab: Tab) => void) {
  const toast = useToast();
  const [isMorePageOpen, setIsMorePageOpen] = useState(false);
  const [isSettingsPageOpen, setIsSettingsPageOpen] = useState(false);
  const [isAccountManagementOpen, setIsAccountManagementOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isWithdrawalChecked, setIsWithdrawalChecked] = useState(false);
  const [isPasswordSetupPopupOpen, setIsPasswordSetupPopupOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [isPasswordResetSuccessOpen, setIsPasswordResetSuccessOpen] = useState(false);
  const [isPasswordResetErrorOpen, setIsPasswordResetErrorOpen] = useState(false);
  const [isSimpleLoginSettingsOpen, setIsSimpleLoginSettingsOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPrologueOpen, setIsPrologueOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isNotificationPrefsOpen, setIsNotificationPrefsOpen] = useState(false);
  const [isPhoneNumberOpen, setIsPhoneNumberOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const openMorePage = () => setIsMorePageOpen(true);
  const closeMorePage = () => setIsMorePageOpen(false);

  const openPhoneNumber = () => setIsPhoneNumberOpen(true);
  const closePhoneNumber = () => setIsPhoneNumberOpen(false);

  const openSettingsPage = () => setIsSettingsPageOpen(true);
  const closeSettingsPage = () => setIsSettingsPageOpen(false);

  const openAccountManagement = () => setIsAccountManagementOpen(true);
  const closeAccountManagement = () => setIsAccountManagementOpen(false);

  const openWithdrawal = () => setIsWithdrawalOpen(true);
  const closeWithdrawal = () => setIsWithdrawalOpen(false);
  const toggleWithdrawalChecked = () => setIsWithdrawalChecked(prev => !prev);

  const openAccountChange = () => {
    const isSocialUser = user?.providerData.some(p => p.providerId === 'google.com');
    if (isSocialUser) {
      setIsPasswordSetupPopupOpen(true);
    } else {
      // Normal account change logic would go here
    }
  };

  const closePasswordSetupPopup = () => setIsPasswordSetupPopupOpen(false);

  // Chooses password-reset (first-time, social users) vs password-change (existing password) flow
  const openPasswordFlow = () => {
    const isSocialUser = user?.providerData.some(p => p.providerId === 'google.com');
    const hasPassword = user?.providerData.some(p => p.providerId === 'password');

    if (isSocialUser && !hasPassword) {
      setIsPasswordResetOpen(true);
    } else {
      setIsPasswordChangeOpen(true);
    }
  };

  const closePasswordChange = () => setIsPasswordChangeOpen(false);
  const closePasswordReset = () => setIsPasswordResetOpen(false);
  const closePasswordResetSuccess = () => setIsPasswordResetSuccessOpen(false);
  const closePasswordResetError = () => setIsPasswordResetErrorOpen(false);

  const resetPasswordFields = () => {
    setCurrentPassword('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsSettingsPageOpen(false);
      setIsMorePageOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !password || !confirmPassword) {
      toast.error('すべての項目を入力してください。');
      return;
    }
    if (password !== confirmPassword) {
      setIsPasswordResetErrorOpen(true);
      return;
    }
    if (!user || !user.email) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, password);

      setIsPasswordChangeOpen(false);
      setIsPasswordResetSuccessOpen(true);
      resetPasswordFields();
    } catch (error) {
      console.error('Password change failed:', error);
      setIsPasswordResetErrorOpen(true);
    }
  };

  const handleSetPasswordForSocialUser = async () => {
    if (password !== confirmPassword) {
      toast.error('パスワードが一致しません。');
      return;
    }
    if (!user || !user.email) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, credential);
      setIsPasswordResetOpen(false);
      setIsPasswordResetSuccessOpen(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password reset failed:', error);
      toast.error('パスワードの設定に失敗しました。時間をおいて再度お試しください。');
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    try {
      // In a real app, we would delete user data from Firestore here
      // and then delete the Auth account.
      // For this demo, we'll just log out.
      await signOut(auth);
      setIsWithdrawalOpen(false);
      setIsAccountManagementOpen(false);
      setIsSettingsPageOpen(false);
      setIsMorePageOpen(false);
      setActiveTab('today');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  const openInquiry = () => setIsInquiryOpen(true);
  const closeInquiry = () => setIsInquiryOpen(false);

  const openHelp = () => setIsHelpOpen(true);
  const closeHelp = () => setIsHelpOpen(false);
  const openPrologue = () => setIsPrologueOpen(true);
  const closePrologue = () => setIsPrologueOpen(false);
  const openLegal = () => setIsLegalOpen(true);
  const closeLegal = () => setIsLegalOpen(false);
  const openNotificationPrefs = () => setIsNotificationPrefsOpen(true);
  const closeNotificationPrefs = () => setIsNotificationPrefsOpen(false);

  const openSimpleLoginSettings = () => setIsSimpleLoginSettingsOpen(true);
  const closeSimpleLoginSettings = () => setIsSimpleLoginSettingsOpen(false);

  return {
    isMorePageOpen, openMorePage, closeMorePage,
    isSettingsPageOpen, openSettingsPage, closeSettingsPage,
    isAccountManagementOpen, openAccountManagement, closeAccountManagement,
    isWithdrawalOpen, openWithdrawal, closeWithdrawal,
    isWithdrawalChecked, toggleWithdrawalChecked,
    isPasswordSetupPopupOpen, closePasswordSetupPopup,
    isPasswordResetOpen, closePasswordReset,
    isPasswordChangeOpen, closePasswordChange,
    isPasswordResetSuccessOpen, closePasswordResetSuccess,
    isPasswordResetErrorOpen, closePasswordResetError,
    isSimpleLoginSettingsOpen, openSimpleLoginSettings, closeSimpleLoginSettings,
    isInquiryOpen, openInquiry, closeInquiry,
    isHelpOpen, openHelp, closeHelp,
    isPrologueOpen, openPrologue, closePrologue,
    isLegalOpen, openLegal, closeLegal,
    isNotificationPrefsOpen, openNotificationPrefs, closeNotificationPrefs,
    isPhoneNumberOpen, openPhoneNumber, closePhoneNumber,
    currentPassword, setCurrentPassword,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    openAccountChange,
    openPasswordFlow,
    handleLogout,
    handleChangePassword,
    handleSetPasswordForSocialUser,
    handleWithdraw,
  };
}

export type AccountSettings = ReturnType<typeof useAccountSettings>;
