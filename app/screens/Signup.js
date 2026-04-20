import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { registerUser } from "../../aws/authService"; // ← AWS Cognito

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
  ForgotPasswordText,
  Divider,
  DividerLine,
  DividerText,
  GoogleButton,
  GoogleText,
  SignUpContainer,
  SignUpText,
  SignUpLink,
  SignUpLinkText,
} from "../../components/styles";

const Signup = () => {
  const router = useRouter();

  const [fullName,         setFullName]         = useState("");
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [hidePassword,     setHidePassword]     = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      await registerUser(email, password); // AWS Cognito sign-up
      router.push("/screens/Welcome");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <StyledContainer>
      <InnerContainer>

        <SubTitle>NEW ACCOUNT</SubTitle>

        <PageTitle>
          Join <Highlight>MycoTrack</Highlight>
        </PageTitle>

        {/* FULL NAME */}
        <InputLabel>FULL NAME</InputLabel>
        <InputContainer>
          <Ionicons name="person-outline" size={20} color="#C9A98B" />
          <StyledInput
            placeholder="Jane Forager"
            placeholderTextColor="#8B6B4A"
            value={fullName}
            onChangeText={setFullName}
          />
        </InputContainer>

        {/* EMAIL */}
        <InputLabel>EMAIL</InputLabel>
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

        {/* PASSWORD */}
        <InputLabel>PASSWORD</InputLabel>
        <InputContainer>
          <Ionicons name="lock-closed-outline" size={20} color="#C9A98B" />
          <StyledInput
            placeholder="Min. 6 characters"
            placeholderTextColor="#8B6B4A"
            secureTextEntry={hidePassword}
            value={password}
            onChangeText={setPassword}
          />
          <Ionicons
            name={hidePassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#C9A98B"
            onPress={() => setHidePassword(!hidePassword)}
          />
        </InputContainer>

        {/* CONFIRM PASSWORD */}
        <InputLabel>CONFIRM PASSWORD</InputLabel>
        <InputContainer>
          <Ionicons name="lock-closed-outline" size={20} color="#C9A98B" />
          <StyledInput
            placeholder="••••••••"
            placeholderTextColor="#8B6B4A"
            secureTextEntry={hideConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Ionicons
            name={hideConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#C9A98B"
            onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
          />
        </InputContainer>

        {/* CREATE ACCOUNT BUTTON */}
        <ButtonContainer onPress={handleSignup}>
          <GradientButton
            colors={["#A65E1B", "#D88A2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ButtonText>Create Account →</ButtonText>
          </GradientButton>
        </ButtonContainer>

        <SignUpContainer>
          <SignUpText>Already registered?</SignUpText>
          <SignUpLink onPress={() => router.push("/screens/Login")}>
            <SignUpLinkText>Sign in</SignUpLinkText>
          </SignUpLink>
        </SignUpContainer>

      </InnerContainer>
    </StyledContainer>
  );
};

export default Signup;