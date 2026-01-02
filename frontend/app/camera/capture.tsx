import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function capture() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View className='flex-1 justify-center bg-black'>
                <Text className='text-center pb-2.5'>Camera permission required</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
        <View className='flex-1 justify-center bg-black'>
            <CameraView className='flex-1' facing={facing} />
            <View className='absolute bottom-16 flex-row w-full px-16 bg-transparent'>
                <TouchableOpacity className='flex-1 items-center' onPress={toggleCameraFacing}>
                    <Text className='text-2xl font-bold text-white'>Flip Camera</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}