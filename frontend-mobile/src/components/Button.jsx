import React from 'react'
import { TouchableOpacity, Text, View } from 'react-native'

export default function Button({children, variant='primary', style, onPress}){
  const base = {paddingVertical:12, paddingHorizontal:16, borderRadius:12, alignItems:'center', justifyContent:'center'}
  const variants = {
    primary: {...base, backgroundColor: '#0F766E'},
    outline: {...base, backgroundColor:'#fff', borderWidth:1, borderColor:'#E6EDF8'}
  }
  return (
    <TouchableOpacity onPress={onPress} style={[variants[variant], style]}>
      <Text style={{color: variant==='primary' ? '#fff' : '#0F172A', fontWeight:'600'}}>{children}</Text>
    </TouchableOpacity>
  )
}
