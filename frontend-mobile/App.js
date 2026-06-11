import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Login from './src/screens/LoginScreen'
import Register from './src/screens/RegisterScreen'
import GoogleHybrid from './src/screens/GoogleHybridScreen'
import Recover from './src/screens/RecoverScreen'
import ResetPassword from './src/screens/ResetPasswordScreen'

const Stack = createNativeStackNavigator()

export default function App(){
  return (
    <NavigationContainer>
      <SafeAreaView style={{flex:1}}>
        <Stack.Navigator screenOptions={{headerShown:false}}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="GoogleHybrid" component={GoogleHybrid} />
          <Stack.Screen name="Recover" component={Recover} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  )
}
