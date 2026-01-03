import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Platform, Text, TouchableOpacity, View } from 'react-native';

export default function capture() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [photo, setPhoto] = useState<string | null>(null);
    const ref = useRef<CameraView>(null);
    const [isSnapping, setIsSnapping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const side = (params.side as string)

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View className='flex-1 justify-center bg-black'>
                <Text className='text-center pb-2.5'>Camera permission required</Text>
                <Button onPress={requestPermission} title='grant permission' />
            </View>
        );
    }

    const takePicture = async () => {
        if (isSnapping || !ref.current) {
            return;
        }

        setIsSnapping(true); // To prevent double takes of a photo

        try {
            const photoData = await ref.current.takePictureAsync();

            if (photoData?.uri) {
                setPhoto(photoData.uri);
            }
        } catch (error) {
            console.error("Failed to take picture:", error);
        } finally {
            setIsSnapping(false);
        }
    }

    const uploadImage = async () => {
        if (!photo) {
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();  // Sends files to server

            // Append the photo to the form data
            formData.append('file', {
                uri: Platform.OS === 'android' ? photo : photo.replace('file://', ''),
                name: 'card_capture.jpg',
                type: 'image/jpeg',
            } as any);

            formData.append('image_type', side);

            const API_URL = process.env.API_BASE_HOME;

            if (!API_URL) {
                console.error("Missing API URL in .env");
                return;
            }

            // Expect a multipart file upload.
            const response = await fetch(`${API_URL}/detect-card`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Parse JSON coming back from backend
            const json = await response.json();

            if (json.status === 'ok') {
                console.log("Card Detected:", json.data.bbox);
                router.push({
                    pathname: "/camera/confirm",
                    params: {
                        photoUri: photo,
                        bbox: JSON.stringify(json.data.bbox),
                        s3Key: json.data.s3_key,
                        side: side
                    }
                });
            } else {
                Alert.alert("Detection Failed", "Could not find a card. Please try manually cropping.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Upload Error", "Could not connect to server.");
        } finally {
            setIsUploading(false);
        }
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }


    if (photo) {
        return (
            <View>
                <Image source={{ uri: photo }} className='w-64 h-96 rounded-lg mb-8' />
                <TouchableOpacity
                    // Accept Photo
                    onPress={() => {
                        uploadImage();
                        console.log("Upload:", photo);
                    }}
                    disabled={isUploading}
                    className='bg-green-600 w-full py-4 rounded-xl items-center mb-4'
                >
                    {isUploading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className='text-white font-bold text-lg'>
                            Uploading Card
                        </Text>
                    )}
                    <Text className='text-white font-bold'>Upload & Process</Text>
                </TouchableOpacity>

                {/* Only show Retake if no uploading */}
                {!isUploading && (
                    <TouchableOpacity onPress={() => setPhoto(null)}>
                        <Text className='text-gray-400 text-lg'>Retake Photo</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View className='flex-1 justify-center bg-black'>
            <CameraView style={{ flex: 1 }} facing={facing} ref={ref} />

            {/* Overlay Guide */}
            <View className="absolute inset-0 flex-1 justify-center items-center z-10 mb-48">
                <Text className="text-[#B51D66] font-bold bg-black/40 px-3 py-1 rounded overflow-hidden">
                    Align Card Here
                </Text>
                <View className="w-72 h-96 border-2 border-white/70 rounded-lg bg-transparent justify-between items-center py-4" style={{ borderColor: '#B51D66' }} />
            </View>

            {/* Camera Controls */}
            <View className='absolute bottom-16 flex-row w-full px-16 bg-transparent'>
                <TouchableOpacity
                    // Go Back
                    onPress={() => router.back()}
                    className='mt-10 bg-black/50 self-start p-2 rounded-lg'
                >
                    <Text className='text-2xl font-bold text-white'>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    // Change side of camera
                    className='flex-1 items-center' onPress={toggleCameraFacing}
                >
                    <Text className='text-2xl font-bold text-white'>Flip Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    // Take photo
                    className='flex-1 items-center' onPress={takePicture}
                >
                    <Text className='text-2xl font-bold text-white'>Take Picture</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}