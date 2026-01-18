import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {
    const router = useRouter();

    return (
        <View>
            <Text>Welcome!</Text>

            <TouchableOpacity
                onPress={() => {
                    router.push("/camera/staging");
                    console.log("Navigate to Camera Screen");
                }}
                className="bg-blue-600 px-8 py-4 rounded-full"
            >
                <Text className='text-2xl font-bold text-white'>Scan Card</Text>
            </TouchableOpacity>
        </View>
    );
}
