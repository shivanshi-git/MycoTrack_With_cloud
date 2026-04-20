import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { loginUser } from "../../aws/authService"; // ← AWS Cognito

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

const Login = () => {
  const router = useRouter();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [hidePassword, setHidePassword] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      await loginUser(email, password); // AWS Cognito sign-in
      router.push("/screens/Welcome");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <StyledContainer>
      <InnerContainer>

        <PageLogo
          resizeMode="contain"
          source={require("../../assets/app_img/top.png")}
        />

        <SubTitle>WELCOME BACK</SubTitle>

        <PageTitle>
          Sign into <Highlight>MycoTrack</Highlight>
        </PageTitle>

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
            placeholder="••••••••"
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

        <ForgotPassword onPress={() => router.push("/screens/ForgotPassword")}>
          <ForgotPasswordText>Forgot password?</ForgotPasswordText>
        </ForgotPassword>

        {/* LOGIN BUTTON */}
        <ButtonContainer onPress={handleLogin}>
          <GradientButton
            colors={["#A65E1B", "#D88A2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ButtonText>Enter the Farm →</ButtonText>
          </GradientButton>
        </ButtonContainer>

        <Divider>
          <DividerLine />
          <DividerText>OR</DividerText>
          <DividerLine />
        </Divider>

        <GoogleButton>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <GoogleText>Continue with Google</GoogleText>
        </GoogleButton>

        <SignUpContainer>
          <SignUpText>No account?</SignUpText>
          <SignUpLink onPress={() => router.push("/screens/Signup")}>
            <SignUpLinkText>Sign up free</SignUpLinkText>
          </SignUpLink>
        </SignUpContainer>

      </InnerContainer>
    </StyledContainer>
  );
};

export default Login;