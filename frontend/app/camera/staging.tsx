import { View, Text, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '@/lib/api';

const Staging = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [frontImage, setFrontImage] = useState<{ uri: string, s3Key: string } | null>(null);
    const [backImage, setBackImage] = useState<{ uri: string, s3Key: string } | null>(null);

    const [loading, setLoading] = useState(false);

    // Listener checking to see if new information as been added
    useEffect(() => {
        if (params.finalFrontUri && params.finalFrontKey) {
            const newUri = params.finalFrontUri as string;
            if (frontImage?.uri !== newUri) {
                setFrontImage({
                    uri: newUri,
                    s3Key: params.finalFrontKey as string
                });
            }
        }

        if (params.finalBackUri && params.finalBackKey) {
            const newUri = params.finalBackUri as string;
            if (backImage?.uri !== newUri) {
                setBackImage({
                    uri: newUri,
                    s3Key: params.finalBackKey as string
                });
            }
        }
    }, [params.finalFrontUri, params.finalFrontKey, params.finalBackUri, params.finalBackKey]);

    const handleScan = (side: 'front' | 'back') => {
        router.push({
            pathname: "/camera/capture",
            params: {
                side: side, // Tells the camera which side is being scanned
                existingFrontUri: frontImage?.uri || "",
                existingFrontKey: frontImage?.s3Key || "",
                existingBackUri: backImage?.uri || "",
                existingBackKey: backImage?.s3Key || ""
            }
        });
    };

    const handleFinalize = () => {
        // Both images MUST be filled
        if (!frontImage || !backImage) {
            Alert.alert("Missing Images", "Please scan both front and back sides.");
            return;
        }

        console.log("Ready to Extract. Front Key:", frontImage.s3Key, "Back Key:", backImage.s3Key);

        setLoading(true);
        extractTextFromImage();
    };

    const handleCancel = () => {
        setBackImage(null);
        setFrontImage(null);
        setLoading(false);
        router.push("/");
    };

    const extractTextFromImage = async () => {
        try {
            const formData = new FormData();

            formData.append('file', {
                uri: backImage?.uri,
                name: 'backImage.jpg',
                type: 'image/jpeg'
            } as any);

            const response = await apiFetch(`/extract-text`, {
                method: 'POST',
                body: formData
            });

            const json = await response.json();
            console.log('Extraction Result:', json);

            if (json.status === 'ok') {
                router.push({
                    pathname: '/camera/verify_text',
                    params: {
                        name: json.data.name,
                        card_number: json.data.card_number,
                        card_series: json.data.card_series,
                        card_type: json.data.card_type,
                        team_name: json.data.team_name,
                        frontImage: frontImage?.s3Key,
                        backImage: backImage?.s3Key
                    }
                });
            } else {
                router.push({
                    pathname: '/camera/verify_text',
                    params: {
                        frontImage: frontImage?.s3Key,
                        backImage: backImage?.s3Key
                    }
                });
            }
        } catch (error) {
            console.error('Error extracting text:', error);
            Alert.alert("Extraction Error", "There was an error extracting text from the images.");
        } finally {
            setLoading(false);
        }
    }

    // Since front/back logic is the same in these steps
    const CardSlot = ({ side, data }: { side: 'front' | 'back', data: any }) => (
        <TouchableOpacity
            onPress={() => handleScan(side)}
            className="flex-1 bg-white rounded-2xl border-2 border-dashed border-border justify-center items-center overflow-hidden m-3 shadow-sm"
        >
            {data ? (
                <>
                    <Image
                        source={{ uri: data.uri }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />

                    <View className="absolute bottom-0 w-full bg-black/40 py-2 items-center">
                        <Text className="text-white font-semibold">
                            Retake Photo
                        </Text>
                    </View>
                </>
            ) : (
                <View className="items-center">
                    <View className="w-14 h-14 rounded-full bg-light-200 items-center justify-center mb-3">
                        <Text className="text-primary text-3xl font-bold">+</Text>
                    </View>

                    <Text className="text-primary font-semibold uppercase tracking-wide">
                        {side}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background px-6 pt-6">
            {loading ? (
                <View className="flex-1 bg-background justify-center items-center">
                    <ActivityIndicator size="large" color="#1E40AF" />

                    <Text className="text-primary text-lg font-semibold mt-6">
                        Analyzing...
                    </Text>
                </View>
            ) : (
                <SafeAreaView className="flex-1 justify-center">
                    <Text className="text-primary text-4xl font-bold text-center mb-8">
                        New Card
                    </Text>

                    <Text className="text-black font-bold mb-4">
                        Take pictures of the front and the back of your hockey card, simply by clicking below
                    </Text>

                    <Text className="text-black font-bold mb-8">
                        To retake, re-click on the boxes
                    </Text>

                    <View className="flex-row h-72 mb-10">
                        <CardSlot side="front" data={frontImage} />
                        <CardSlot side="back" data={backImage} />
                    </View>

                    <TouchableOpacity
                        onPress={handleFinalize}
                        disabled={!(frontImage && backImage)}
                        className={`w-full py-4 rounded-2xl items-center ${frontImage && backImage
                            ? "bg-primary"
                            : "bg-light-300"
                            }`}
                    >
                        <Text
                            className={`text-lg font-bold ${frontImage && backImage
                                ? "text-white"
                                : "text-dark-200"
                                }`}
                        >
                            Extract Information
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCancel}
                        className="w-full py-4 mt-6 rounded-2xl items-center bg-red-500"
                    >
                        <Text className="text-white font-semibold text-lg">
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </SafeAreaView>
            )}
        </View>
    )
}

export default Staging