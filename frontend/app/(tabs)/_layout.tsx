import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs } from "expo-router";
import React from "react";
import { PixelTabIcon } from "@/components/navigation/PixelTabIcon";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: '#000',
				tabBarInactiveTintColor: '#666',
				tabBarStyle: {
					backgroundColor: '#fef5eb',
					borderTopColor: '#000',
					borderTopWidth: 2,
					height: 90,
					paddingTop: 12,
					paddingBottom: 20,
					paddingHorizontal: 10,
				},
				tabBarLabelStyle: {
					fontFamily: 'PressStart2P',
					fontSize: 8,
					marginTop: 6,
				},
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="trees"
				options={{
					title: "Forest",
					tabBarIcon: ({ color, focused }) => (
						<PixelTabIcon
							type="trees"
							focused={focused}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="focus"
				options={{
					title: "Home",
					tabBarIcon: ({ color, focused }) => (
						<PixelTabIcon
							type="focus"
							focused={focused}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="config"
				options={{
					title: "Social",
					tabBarIcon: ({ color, focused }) => (
						<PixelTabIcon
							type="social"
							focused={focused}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
