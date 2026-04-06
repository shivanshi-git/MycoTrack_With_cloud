import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { resetPassword } from "../../firebase/authService";
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
  SignUpContainer,
  SignUpText,
  SignUpLink,
  SignUpLinkText,
} from "../../components/styles";

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // FIX: Firebase sendPasswordResetEmail sends a reset link, not an OTP.
  // The flow now correctly sends the email and then shows a confirmation alert
  // before navigating back to Login, instead of going to an OTP screen.
  const handleReset = async () => {
    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      alert("Password reset email sent! Check your inbox and follow the link to reset your password.");
      router.push("/screens/Login");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <InnerContainer>

        {/* BACK BUTTON */}

        <SignUpLink onPress={() => router.push("/screens/Login")}>
          <SignUpLinkText>← Back to login</SignUpLinkText>
        </SignUpLink>

        <PageLogo
          resizeMode="contain"
          source={require("../../assets/app_img/forgotpassword.png")}
        />

        <SubTitle>PASSWORD RECOVERY</SubTitle>

        <PageTitle>
          Forgot your <Highlight>password?</Highlight>
        </PageTitle>

        <SignUpText style={{ textAlign: "center", marginBottom: 20 }}>
          Enter your email and we'll send a reset link to your inbox.
        </SignUpText>

        {/* EMAIL INPUT */}

        <InputLabel>EMAIL ADDRESS</InputLabel>

        <InputContainer>
          <Ionicons name="mail-outline" size={20} color="#C9A98B" />
          <StyledInput
            placeholder="jane@forest.com"
            placeholderTextColor="#8B6B4A"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </InputContainer>

        {/* SEND RESET BUTTON */}

        <ButtonContainer onPress={handleReset} disabled={loading}>
          <GradientButton
            colors={["#A65E1B", "#D88A2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ButtonText>{loading ? "Sending..." : "Send Reset Link →"}</ButtonText>
          </GradientButton>
        </ButtonContainer>

        {/* SIGN IN LINK */}

        <SignUpContainer>
          <SignUpText>Remembered it?</SignUpText>
          <SignUpLink onPress={() => router.push("/screens/Login")}>
             <SignUpLinkText>Sign in</SignUpLinkText>
          </SignUpLink>
        </SignUpContainer>

      </InnerContainer>
    </StyledContainer>
  );
};

export default ForgotPassword;
