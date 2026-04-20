// import React, { useState } from "react";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { loginUser } from "../AWS/authService";

// import {
//   StyledContainer,
//   InnerContainer,
//   PageLogo,
//   PageTitle,
//   SubTitle,
//   Highlight,
//   InputContainer,
//   StyledInput,
//   InputLabel,
//   ButtonContainer,
//   GradientButton,
//   ButtonText,
//   ForgotPassword,
//   ForgotPasswordText,
//   Divider,
//   DividerLine,
//   DividerText,
//   GoogleButton,
//   GoogleText,
//   SignUpContainer,
//   SignUpText,
//   SignUpLink,
//   SignUpLinkText,
// } from "../../components/styles";

// const Login = () => {
//   const router = useRouter();

//   const [email,        setEmail]        = useState("");
//   const [password,     setPassword]     = useState("");
//   const [hidePassword, setHidePassword] = useState(true);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       alert("Please enter your email and password.");
//       return;
//     }

//     try {
//       await loginUser(email, password); // AWS Cognito sign-in
//       router.push("/screens/Welcome");
//     } catch (error) {
//       alert(error.message);
//     }
//   };

//   return (
//     <StyledContainer>
//       <InnerContainer>

//         <PageLogo
//           resizeMode="contain"
//           source={require("../../assets/app_img/top.png")}
//         />

//         <SubTitle>WELCOME BACK</SubTitle>

//         <PageTitle>
//           Sign into <Highlight>MycoTrack</Highlight>
//         </PageTitle>

//         {/* EMAIL */}
//         <InputLabel>EMAIL</InputLabel>
//         <InputContainer>
//           <Ionicons name="mail-outline" size={20} color="#C9A98B" />
//           <StyledInput
//             placeholder="jane@forest.com"
//             placeholderTextColor="#8B6B4A"
//             value={email}
//             onChangeText={setEmail}
//             keyboardType="email-address"
//             autoCapitalize="none"
//           />
//         </InputContainer>

//         {/* PASSWORD */}
//         <InputLabel>PASSWORD</InputLabel>
//         <InputContainer>
//           <Ionicons name="lock-closed-outline" size={20} color="#C9A98B" />
//           <StyledInput
//             placeholder="••••••••"
//             placeholderTextColor="#8B6B4A"
//             secureTextEntry={hidePassword}
//             value={password}
//             onChangeText={setPassword}
//           />
//           <Ionicons
//             name={hidePassword ? "eye-off-outline" : "eye-outline"}
//             size={20}
//             color="#C9A98B"
//             onPress={() => setHidePassword(!hidePassword)}
//           />
//         </InputContainer>

//         <ForgotPassword onPress={() => router.push("/screens/ForgotPassword")}>
//           <ForgotPasswordText>Forgot password?</ForgotPasswordText>
//         </ForgotPassword>

//         {/* LOGIN BUTTON */}
//         <ButtonContainer onPress={handleLogin}>
//           <GradientButton
//             colors={["#A65E1B", "#D88A2E"]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//           >
//             <ButtonText>Enter the Farm →</ButtonText>
//           </GradientButton>
//         </ButtonContainer>

//         <Divider>
//           <DividerLine />
//           <DividerText>OR</DividerText>
//           <DividerLine />
//         </Divider>

//         <GoogleButton>
//           <Ionicons name="logo-google" size={20} color="#DB4437" />
//           <GoogleText>Continue with Google</GoogleText>
//         </GoogleButton>

//         <SignUpContainer>
//           <SignUpText>No account?</SignUpText>
//           <SignUpLink onPress={() => router.push("/screens/Signup")}>
//             <SignUpLinkText>Sign up free</SignUpLinkText>
//           </SignUpLink>
//         </SignUpContainer>

//       </InnerContainer>
//     </StyledContainer>
//   );
// };

// export default Login;

/**
 * Login.js
 * Opens AWS Cognito Hosted UI via expo-web-browser.
 * After login/signup Cognito redirects to myapp://signin?code=...
 * The deep link is caught by app/screens/Signin.js which exchanges
 * the code for tokens and navigates to Welcome.
 */

import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { LOGIN_URL, SIGNUP_URL } from "../../src/AWS/cognitoConfig";

WebBrowser.maybeCompleteAuthSession();

const C = {
  bg:     "#0d0702",
  card:   "#1a1008",
  border: "#2a1c0e",
  amber:  "#d4852a",
  amber2: "#f0a535",
  brown:  "#5a3010",
  cream:  "#f0e6d8",
  cream2: "#d8c8b0",
  muted:  "#7a6050",
};

const Login = () => {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  const openCognito = async (url) => {
    setLoading(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(url, "myapp://signin");
      if (result.type === "success" && result.url) {
        const code = new URL(result.url).searchParams.get("code");
        if (code) {
          router.push({ pathname: "/screens/Signin", params: { code } });
        } else {
          Alert.alert("Login error", "No auth code returned from Cognito.");
        }
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.inner}>

        <Ionicons name="leaf-outline" size={72} color={C.amber2} style={{ marginBottom: 32 }} />

        <Text style={s.sub}>WELCOME BACK</Text>
        <Text style={s.title}>
          Sign into <Text style={{ color: C.amber2 }}>MycoTrack</Text>
        </Text>
        <Text style={s.hint}>
          Securely sign in via AWS Cognito.{"\n"}
          Your credentials never touch this device.
        </Text>

        <TouchableOpacity
          onPress={() => openCognito(LOGIN_URL)}
          disabled={loading}
          style={{ width: "100%", borderRadius: 14, overflow: "hidden", marginBottom: 14 }}
        >
          <LinearGradient
            colors={["#A65E1B", "#D88A2E"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.btn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={s.btnText}>Sign In with Cognito</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openCognito(SIGNUP_URL)}
          disabled={loading}
          style={s.outlineBtn}
        >
          <Ionicons name="person-add-outline" size={18} color={C.amber2} />
          <Text style={s.outlineBtnText}>Create Account</Text>
        </TouchableOpacity>

        <View style={s.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={14} color={C.muted} />
          <Text style={s.infoText}>Powered by AWS Cognito · eu-north-1</Text>
        </View>

      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  inner:          { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  sub:            { fontSize: 11, letterSpacing: 3, color: C.muted, fontWeight: "500", marginBottom: 8, textTransform: "uppercase" },
  title:          { fontSize: 28, fontWeight: "700", color: C.cream, textAlign: "center", marginBottom: 12 },
  hint:           { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20, marginBottom: 36 },
  btn:            { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14 },
  btnText:        { color: "#fff", fontSize: 16, fontWeight: "700" },
  outlineBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: C.amber, marginBottom: 32 },
  outlineBtnText: { color: C.amber2, fontSize: 15, fontWeight: "600" },
  infoBox:        { flexDirection: "row", alignItems: "center", gap: 7 },
  infoText:       { fontSize: 11, color: C.muted },
});

export default Login;