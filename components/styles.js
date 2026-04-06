import styled from "styled-components/native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";

const StatusBarHeight = Constants.statusBarHeight;

// Colors
export const Colors = {
  primary: "#1E0F05",
  secondary: "#2A1608",

  accent: "#D88A2E",
  accentLight: "#F2A94E",

  textPrimary: "#F5E6D3",
  textSecondary: "#C9A98B",
  textMuted: "#8B6B4A",

  inputBackground: "#2C1A0D",
  inputBorder: "#4A2C17",

  buttonGradientStart: "#A65E1B",
  buttonGradientEnd: "#D88A2E",

  white: "#FFFFFF",
  black: "#000000",

  error: "#FF6B6B",
};

export const StyledContainer = styled(View)`
  flex: 1;
  padding-top: ${StatusBarHeight + 10}px;
  background-color: ${Colors.primary};
`;

export const InnerContainer = styled(View)`
  flex: 1;
  width: 100%;
  align-items: center;
`;

export const PageLogo = styled(Image)`
  width: 100px;
  height: 80px;
  margin-top: 20px;
  margin-bottom: 10px;
`;

export const PageTitle = styled(Text)`
  font-size: 30px;
  text-align: center;
  font-weight: 700;
  color: ${Colors.textPrimary};
  letter-spacing: 1px;
`;

export const SubTitle = styled(Text)`
  color: ${Colors.accentLight};
  font-size: 12px;
  letter-spacing: 3px;
  margin-bottom: 10px;
`;

export const Highlight = styled(Text)`
  color: ${Colors.accent};
  font-style: italic;
`;

export const InputContainer = styled(View)`
  width: 85%;
  background-color: ${Colors.inputBackground};
  border-radius: 12px;
  border: 1px solid ${Colors.inputBorder};
  flex-direction: row;
  align-items: center;
  padding: 12px;
  margin-top: 20px;
`;

export const StyledInput = styled(TextInput)`
  flex: 1;
  color: ${Colors.textPrimary};
  font-size: 16px;
  padding-left: 10px;
`;

export const InputLabel = styled(Text)`
  width: 85%;
  color: ${Colors.textSecondary};
  margin-top: 20px;
  font-size: 12px;
  letter-spacing: 1px;
`;

export const ButtonContainer = styled(TouchableOpacity)`
  width: 85%;
  margin-top: 30px;
`;

export const GradientButton = styled(LinearGradient)`
  padding: 16px;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
`;

export const ButtonText = styled(Text)`
  color: ${Colors.white};
  font-size: 18px;
  font-weight: bold;
`;

// FIX: Changed from styled(Text) to styled(TouchableOpacity) so onPress works reliably
export const ForgotPassword = styled(TouchableOpacity)`
  width: 85%;
  align-items: flex-end;
  margin-top: 10px;
`;

export const ForgotPasswordText = styled(Text)`
  color: ${Colors.accentLight};
`;

export const Divider = styled(View)`
  width: 85%;
  flex-direction: row;
  align-items: center;
  margin: 25px 0;
`;

export const DividerLine = styled(View)`
  flex: 1;
  height: 1px;
  background-color: ${Colors.inputBorder};
`;

export const DividerText = styled(Text)`
  margin: 0 10px;
  color: ${Colors.textMuted};
`;

export const GoogleButton = styled(TouchableOpacity)`
  width: 85%;
  border: 1px solid #4a2c17;
  border-radius: 12px;
  padding: 14px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

export const GoogleText = styled(Text)`
  color: ${Colors.textPrimary};
  margin-left: 10px;
  font-size: 16px;
`;

export const SignUpContainer = styled(View)`
  flex-direction: row;
  margin-top: 20px;
`;

export const SignUpText = styled(Text)`
  color: ${Colors.textMuted};
`;

// FIX: Changed from styled(Text) to styled(TouchableOpacity) so onPress is reliable across all screens
export const SignUpLink = styled(TouchableOpacity)`
  margin-left: 5px;
`;

export const SignUpLinkText = styled(Text)`
  color: ${Colors.accentLight};
`;
