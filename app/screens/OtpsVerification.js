import React, { useState, useRef } from "react";
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  StyledContainer,
  InnerContainer,
  PageLogo,
  PageTitle,
  SubTitle,
  Highlight,
  InputContainer,
  StyledInput,
  InputLabel,
  ButtonContainer,
  GradientButton,
  ButtonText,
  ForgotPassword,
  ForgotPasswordText,  // 👈
  Divider,
  DividerLine,
  DividerText,
  GoogleButton,
  GoogleText,
  SignUpContainer,
  SignUpText,
  SignUpLink,
  SignUpLinkText,      // 👈
} from "../../components/styles";

const OtpVerification = () => {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  // FIX: Added refs for each input so we can auto-advance focus between boxes
  const inputRefs = useRef([]);

  const handleOtpChange = (value, index) => {
    // Only accept single numeric digits
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next box when a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    // Move back to previous box on backspace if current box is empty
    if (nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length < 6) {
      alert("Please enter the complete 6-digit code.");
      return;
    }
    // Navigate to success screen after verification
    router.push("/screens/ResetSuccess");
  };

  return (
    <StyledContainer>
      <InnerContainer>

        <PageLogo
          resizeMode="contain"
          source={require("../../assets/app_img/OTP.png")}
        />

        {/* BACK BUTTON */}

        <SignUpLink onPress={() => router.push("/screens/ForgotPassword")}>
          ← Back
        </SignUpLink>

        {/* ICON */}

        <Ionicons
          name="key-outline"
          size={80}
          color="#D88A2E"
          style={{ marginBottom: 20 }}
        />

        <SubTitle>VERIFICATION</SubTitle>

        <PageTitle>
          Enter the <Highlight>OTP</Highlight>
        </PageTitle>

        <SignUpText style={{ textAlign: "center", marginBottom: 20 }}>
          We sent a 6-digit code to your email. Check your inbox.
        </SignUpText>

        {/* OTP BOXES */}

        <View style={{ flexDirection: "row", gap: 10 }}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              maxLength={1}
              keyboardType="numeric"
              style={{
                width: 45,
                height: 50,
                borderWidth: 1,
                borderColor: "#D88A2E",
                borderRadius: 10,
                textAlign: "center",
                color: "#fff",
                fontSize: 18,
              }}
            />
          ))}
        </View>

        {/* RESEND TIMER */}

        <SignUpText style={{ marginTop: 20 }}>
          Resend in 29s
        </SignUpText>

        {/* VERIFY BUTTON */}

        <ButtonContainer onPress={handleVerify}>
          <GradientButton
            colors={["#A65E1B", "#D88A2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ButtonText>Verify Code →</ButtonText>
          </GradientButton>
        </ButtonContainer>

      </InnerContainer>
    </StyledContainer>
  );
};

export default OtpVerification;
