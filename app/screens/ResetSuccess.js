import React from "react";
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

const ResetSuccess = () => {
  const router = useRouter();

  return (
    <StyledContainer>
      <InnerContainer style={{ justifyContent: "center" }}>

        <PageLogo
          resizeMode="contain"
          source={require("../../assets/app_img/Resetpass.png")}
        />

        {/* SUCCESS ICON */}

        <Ionicons
          name="checkmark-circle-outline"
          size={90}
          color="#8BD99B"
          style={{ marginBottom: 20 }}
        />

        {/* TITLE */}

        <PageTitle>Password Reset!</PageTitle>

        {/* MESSAGE */}

        <SignUpText style={{ textAlign: "center", marginTop: 10 }}>
          Your password has been updated successfully.{"\n"}
          You can now sign in with your new password.
        </SignUpText>

        {/* BUTTON */}

        <ButtonContainer onPress={() => router.push("/screens/Login")}>
          <GradientButton
            colors={["#A65E1B", "#D88A2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ButtonText>Back to Login →</ButtonText>
          </GradientButton>
        </ButtonContainer>

      </InnerContainer>
    </StyledContainer>
  );
};

export default ResetSuccess;
