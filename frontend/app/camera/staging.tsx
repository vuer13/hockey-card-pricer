import { View, Text, Alert, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';

const staging = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [frontImage, setFrontImage] = useState<{ uri: string, s3Key: string } | null>(null);
    const [backImage, setBackImage] = useState<{ uri: string, s3Key: string } | null>(null);

    // Listener checking to see if new information as been added
    useEffect(() => {
        if (params?.capturedUri && params?.side && params?.s3Key) {
            const newData = {
                uri: params.capturedUri as string,
                s3Key: params.s3Key as string
            };

            if (params.side === 'front') {
                setFrontImage(newData);
            }
            if (params.side === 'back') {
                setBackImage(newData);
            }
        }
    }, [params]); // Dependency array, watching params for any changes

    const handleScan = (side: 'front' | 'back') => {
        router.push({
            pathname: "/camera/capture",
            params: { side: side } // Tells the camera which side is being scanned
        });
    };

    const handleFinalize = () => {
        // Both images MUST be filled
        if (!frontImage || !backImage) {
            Alert.alert("Missing Images", "Please scan both front and back sides.");
            return;
        }

        console.log("Ready to Extract. Front Key:", frontImage.s3Key, "Back Key:", backImage.s3Key);

        // TODO: Navigate to the extraction/pricing screen
    };

    // Since front/back logic is the same in these steps
    const CardSlot = ({ side, data }: { side: 'front' | 'back', data: any }) => (
        <TouchableOpacity
            onPress={() => handleScan(side)} // Start process of getting photo
        >
            {data ? (
                <>
                    <Image source={{ uri: data.uri }} className="w-full h-full" resizeMode="cover" />

                    <View className="absolute bottom-0 items-center">
                        <Text className="text-white font-bold">Retake Photo</Text>
                    </View>
                </>
            ) : (
                //Show plus button if no photo yet
                <View className="items-center">
                    <View className="w-12 h-12 rounded-full bg-gray-700 items-center justify-center mb-2">
                        <Text className="text-white text-2xl">+</Text>
                    </View>
                    <Text className="text-white-400 font-bold uppercase">{side}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView>
            <Text className="text-white text-2xl font-bold text-center mb-2">New Entry</Text>

            <View className="flex-row h-64 mb-8">
                <CardSlot side="front" data={frontImage} />
                <CardSlot side="back" data={backImage} />
            </View>

            <TouchableOpacity
                onPress={handleFinalize}
                className={`w-full py-4 rounded-xl items-center ${(frontImage && backImage) ? 'bg-blue-600' : 'bg-gray-800'
                    }`}
                disabled={!frontImage || !backImage}
            >
                <Text className={`text-lg font-bold ${(frontImage && backImage) ? 'text-white' : 'text-gray-500'
                    }`}>
                    Extract Information
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

export default staging