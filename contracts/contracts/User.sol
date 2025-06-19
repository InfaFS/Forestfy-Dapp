// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title UserRegistry
 * @dev Contrato para gestionar usuarios con nombres únicos y listas de amigos
 */
contract UserRegistry is Ownable {
    using Strings for string;

    // Estructura para almacenar información del usuario
    struct User {
        string name;
        address userAddress;
        bool exists;
        address[] friends;
        mapping(address => bool) isFriend;
        uint256 createdAt;
    }

    // Mapeo de direcciones a usuarios
    mapping(address => User) public users;
    
    // Mapeo de nombres a direcciones para verificar unicidad
    mapping(string => address) public nameToAddress;
    
    // Array de todas las direcciones registradas
    address[] public allUsers;
    
    // Eventos
    event UserRegistered(address indexed userAddress, string name, uint256 timestamp);
    event FriendAdded(address indexed user, address indexed friend, uint256 timestamp);
    event FriendRemoved(address indexed user, address indexed friend, uint256 timestamp);
    event NameTaken(string name, address indexed userAddress);

    // Modificadores
    modifier userExists(address _user) {
        require(users[_user].exists, "Usuario no registrado");
        _;
    }

    modifier userNotExists(address _user) {
        require(!users[_user].exists, "Usuario ya registrado");
        _;
    }

    modifier nameNotTaken(string memory _name) {
        require(nameToAddress[_name] == address(0), "Nombre ya tomado");
        _;
    }

    modifier validName(string memory _name) {
        require(bytes(_name).length > 0, "Nombre no puede estar vacio");
        require(bytes(_name).length <= 50, "Nombre demasiado largo");
        _;
    }

    /**
     * @dev Registra un nuevo usuario
     * @param _name Nombre único del usuario
     */
    function registerUser(string memory _name) 
        public 
        userNotExists(msg.sender)
        nameNotTaken(_name)
        validName(_name)
    {
        User storage newUser = users[msg.sender];
        newUser.name = _name;
        newUser.userAddress = msg.sender;
        newUser.exists = true;
        newUser.createdAt = block.timestamp;
        
        nameToAddress[_name] = msg.sender;
        allUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender, _name, block.timestamp);
    }

    /**
     * @dev Agrega un amigo a la lista del usuario
     * @param _friendAddress Dirección del amigo a agregar
     */
    function addFriend(address _friendAddress) 
        public 
        userExists(msg.sender)
        userExists(_friendAddress)
    {
        require(msg.sender != _friendAddress, "No puedes agregarte a ti mismo");
        require(!users[msg.sender].isFriend[_friendAddress], "Ya es tu amigo");
        
        users[msg.sender].friends.push(_friendAddress);
        users[msg.sender].isFriend[_friendAddress] = true;
        
        emit FriendAdded(msg.sender, _friendAddress, block.timestamp);
    }

    /**
     * @dev Remueve un amigo de la lista del usuario
     * @param _friendAddress Dirección del amigo a remover
     */
    function removeFriend(address _friendAddress) 
        public 
        userExists(msg.sender)
    {
        require(users[msg.sender].isFriend[_friendAddress], "No es tu amigo");
        
        // Remover de la lista de amigos
        address[] storage friends = users[msg.sender].friends;
        for (uint i = 0; i < friends.length; i++) {
            if (friends[i] == _friendAddress) {
                friends[i] = friends[friends.length - 1];
                friends.pop();
                break;
            }
        }
        
        users[msg.sender].isFriend[_friendAddress] = false;
        
        emit FriendRemoved(msg.sender, _friendAddress, block.timestamp);
    }

    /**
     * @dev Obtiene información completa de un usuario
     * @param _userAddress Dirección del usuario
     * @return name Nombre del usuario
     * @return userAddress Dirección del usuario
     * @return exists Si el usuario existe
     * @return friends Lista de amigos
     * @return createdAt Timestamp de creación
     */
    function getUserInfo(address _userAddress) 
        public 
        view 
        returns (
            string memory name,
            address userAddress,
            bool exists,
            address[] memory friends,
            uint256 createdAt
        )
    {
        User storage user = users[_userAddress];
        return (
            user.name,
            user.userAddress,
            user.exists,
            user.friends,
            user.createdAt
        );
    }

    /**
     * @dev Verifica si dos usuarios son amigos
     * @param _user1 Dirección del primer usuario
     * @param _user2 Dirección del segundo usuario
     * @return True si son amigos
     */
    function areFriends(address _user1, address _user2) 
        public 
        view 
        returns (bool)
    {
        return users[_user1].isFriend[_user2];
    }

    /**
     * @dev Obtiene la lista de amigos de un usuario
     * @param _userAddress Dirección del usuario
     * @return Lista de direcciones de amigos
     */
    function getFriends(address _userAddress) 
        public 
        view 
        userExists(_userAddress)
        returns (address[] memory)
    {
        return users[_userAddress].friends;
    }

    /**
     * @dev Obtiene el número de amigos de un usuario
     * @param _userAddress Dirección del usuario
     * @return Número de amigos
     */
    function getFriendCount(address _userAddress) 
        public 
        view 
        userExists(_userAddress)
        returns (uint256)
    {
        return users[_userAddress].friends.length;
    }

    /**
     * @dev Verifica si un nombre está disponible
     * @param _name Nombre a verificar
     * @return True si está disponible
     */
    function isNameAvailable(string memory _name) 
        public 
        view 
        returns (bool)
    {
        return nameToAddress[_name] == address(0);
    }

    /**
     * @dev Obtiene la dirección de un usuario por su nombre
     * @param _name Nombre del usuario
     * @return Dirección del usuario
     */
    function getAddressByName(string memory _name) 
        public 
        view 
        returns (address)
    {
        return nameToAddress[_name];
    }

    /**
     * @dev Obtiene todos los usuarios registrados
     * @return Lista de todas las direcciones registradas
     */
    function getAllUsers() 
        public 
        view 
        returns (address[] memory)
    {
        return allUsers;
    }

    /**
     * @dev Obtiene el número total de usuarios registrados
     * @return Número total de usuarios
     */
    function getTotalUsers() 
        public 
        view 
        returns (uint256)
    {
        return allUsers.length;
    }

    /**
     * @dev Verifica si una dirección está registrada
     * @param _userAddress Dirección a verificar
     * @return True si está registrada
     */
    function isUserRegistered(address _userAddress) 
        public 
        view 
        returns (bool)
    {
        return users[_userAddress].exists;
    }
}
