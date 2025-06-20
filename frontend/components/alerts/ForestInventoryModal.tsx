import React from 'react';
import { View, Text, Image, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

interface TreeItem {
  id: number;
  name: string;
  image: any;
}

interface ForestInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTree: (treeId: number) => void;
}

const AVAILABLE_TREES: TreeItem[] = [
  {
    id: 1,
    name: 'TREE',
    image: require('@/public/treenormal.png'),
  },
  // Puedes agregar más árboles aquí en el futuro
];

export function ForestInventoryModal({ visible, onClose, onSelectTree }: ForestInventoryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header con título y botón cerrar */}
          <View style={styles.header}>
            <Text style={styles.title}>FOREST</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de árboles disponibles */}
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {AVAILABLE_TREES.map((tree) => (
              <TouchableOpacity
                key={tree.id}
                style={styles.treeItem}
                onPress={() => onSelectTree(tree.id)}
              >
                <View style={styles.treeItemContent}>
                  <Image 
                    source={tree.image} 
                    style={styles.treeImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.treeName}>{tree.name}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>🗑</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#e0e0e0',
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 0,
    width: 300,
    maxHeight: 400,
    // Efecto de relieve pixelado
    borderTopColor: '#fff',
    borderLeftColor: '#fff',
    borderRightColor: '#333',
    borderBottomColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#c0c0c0',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: '#000',
  },
  closeButton: {
    backgroundColor: '#ff0000',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 0,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    // Efecto de relieve pixelado
    borderTopColor: '#ff6666',
    borderLeftColor: '#ff6666',
    borderRightColor: '#800000',
    borderBottomColor: '#800000',
  },
  closeButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: '#fff',
  },
  itemsList: {
    padding: 12,
  },
  treeItem: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 0,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    // Efecto de relieve pixelado
    borderTopColor: '#fff',
    borderLeftColor: '#fff',
    borderRightColor: '#999',
    borderBottomColor: '#999',
  },
  treeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  treeImage: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  treeName: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: '#000',
  },
  deleteButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 0,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
  },
}); 