export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  '(modals)': undefined;
};

export type AuthStackParamList = {
  welcome: undefined;
  'phone-login': undefined;
  'verify-code': { phoneNumber: string };
  'create-profile': undefined;
};

export type TabParamList = {
  discover: undefined;
  camera: undefined;
  inbox: undefined;
  chat: undefined;
  profile: undefined;
};

export type ModalParamList = {
  'view-gasp': { gaspId: string };
  'reaction-result': { reactionId: string };
  'send-gasp': { imageUri: string };
  'camera-preview': { imageUri: string };
  'friend-profile': { friendId: string };
  settings: undefined;
  'edit-profile': undefined;
};
