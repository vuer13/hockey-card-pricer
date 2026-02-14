import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View, Image, ScrollView } from "react-native";

export default function Index() {
    const router = useRouter();

    return (
        <ScrollView className="flex-1 bg-background" contentContainerStyle={{ flexGrow: 1 }} >
            <View className="flex-1 justify-center items-center bg-background px-6">
                <View className="w-full max-w-md items-center">

                    <Text className="text-5xl text-primary font-bold text-center mb-8">
                        Welcome to the Hockey Price Evaluator
                    </Text>

                    <View className="flex-row items-start mb-6">
                        <Image
                            source={require("../../assets/images/camera.jpg")}
                            className="w-8 h-8 mr-4"
                        />
                        <Text className="flex-1 text-base text-gray-600">
                            Take a picture of your hockey card.
                        </Text>
                    </View>

                    <View className="flex-row items-start mb-6">
                        <Image
                            source={require("../../assets/images/ai.webp")}
                            className="w-8 h-14 mr-4"
                        />
                        <Text className="flex-1 text-base text-gray-600">
                            Our AI extracts the player, set, and card details automatically.
                        </Text>
                    </View>

                    <View className="flex-row items-start mb-10">
                        <Image
                            source={require("../../assets/images/money.png")}
                            className="w-8 h-8 mr-4"
                        />
                        <Text className="flex-1 text-base text-gray-600">
                            Instantly see the estimated market value of your card.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push("/camera/staging")}
                        className="bg-primary px-10 py-4 rounded-xl w-full items-center"
                    >
                        <Text className="text-xl font-semibold text-white">
                            Scan Your Card!
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </ScrollView>
    );
}
