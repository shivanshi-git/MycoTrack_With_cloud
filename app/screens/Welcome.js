import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  StyledContainer,
  InnerContainer,
  PageTitle,
  SubTitle,
  Highlight,
  ButtonContainer,
  GradientButton,
  ButtonText,
  SignUpText,
} from "../../components/styles";
 
const Welcome = () => {
  const router = useRouter();
 
  return (
    <StyledContainer>
      <InnerContainer style={{ justifyContent: "center" }}>
 
        <Ionicons name="leaf-outline" size={80} color="#D88A2E" style={{ marginBottom: 20 }} />
 
        <SubTitle>WELCOME</SubTitle>
 
        <PageTitle>
          Welcome to <Highlight>MycoTrack</Highlight>
        </PageTitle>
 
        <SignUpText style={{ textAlign: "center", marginTop: 10 }}>
          Start exploring and tracking your mushroom discoveries.
        </SignUpText>
 
        {/* ✅ Fixed: navigates to CameraAI instead of showing an alert */}
        <ButtonContainer onPress={() => router.replace("/screens/CameraAI")}>
          <GradientButton
            colors={["#A65E1B", "#D88A2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ButtonText>Enter the Forest →</ButtonText>
          </GradientButton>
        </ButtonContainer>
 
      </InnerContainer>
    </StyledContainer>
  );
};
 
export default Welcome;