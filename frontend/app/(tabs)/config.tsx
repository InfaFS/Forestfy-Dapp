import { StatusBar } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StyleSheet } from "react-native";
import { ConfigIcon } from '@/components/common/ConfigIcon';

export default function ConfigScreen() {
	return (
		<ProtectedRoute>
			<ThemedView style={styles.container}>
				<StatusBar barStyle="dark-content" />
				<ThemedView style={styles.titleContainer}>
					<ThemedText type="title" style={{fontFamily: 'PressStart2P_400Regular', fontSize: 18, textAlign: 'center'}}>
						Social
					</ThemedText>
									</ThemedView>
			</ThemedView>
		</ProtectedRoute>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 60,
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 20,
		justifyContent: 'center',
		marginTop: 40,
		marginBottom: 20,
		position: 'relative',
	},
}); 