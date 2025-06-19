// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IForestToken {
    function virtualBurn(address from, uint256 amount) external;
}

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

    // Mapeo para solicitudes de amistad: from => to => bool
    mapping(address => mapping(address => bool)) public friendRequests;

    // Referencia al contrato de tokens
    IForestToken public forestToken;

    // Eventos
    event UserRegistered(
        address indexed userAddress,
        string name,
        uint256 timestamp
    );
    event FriendAdded(
        address indexed user,
        address indexed friend,
        uint256 timestamp
    );
    event FriendRemoved(
        address indexed user,
        address indexed friend,
        uint256 timestamp
    );
    event NameTaken(string name, address indexed userAddress);
    event NameChanged(
        address indexed userAddress,
        string oldName,
        string newName,
        uint256 timestamp
    );
    event FriendRequestSent(
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    event FriendRequestAccepted(
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

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
     * @dev Establece la dirección del contrato de tokens (solo owner)
     * @param _forestTokenAddress Dirección del contrato ForestToken
     */
    function setForestTokenAddress(
        address _forestTokenAddress
    ) public onlyOwner {
        forestToken = IForestToken(_forestTokenAddress);
    }

    /**
     * @dev Registra un nuevo usuario
     * @param _name Nombre único del usuario
     */
    function registerUser(
        string memory _name
    ) public userNotExists(msg.sender) nameNotTaken(_name) validName(_name) {
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
     * @dev Remueve un amigo de la lista del usuario
     * @param _friendAddress Dirección del amigo a remover
     */
    function removeFriend(
        address _friendAddress
    ) public userExists(msg.sender) {
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
    function getUserInfo(
        address _userAddress
    )
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
    function areFriends(
        address _user1,
        address _user2
    ) public view returns (bool) {
        return users[_user1].isFriend[_user2];
    }

    /**
     * @dev Obtiene la lista de amigos de un usuario
     * @param _userAddress Dirección del usuario
     * @return Lista de direcciones de amigos
     */
    function getFriends(
        address _userAddress
    ) public view userExists(_userAddress) returns (address[] memory) {
        return users[_userAddress].friends;
    }

    /**
     * @dev Obtiene el número de amigos de un usuario
     * @param _userAddress Dirección del usuario
     * @return Número de amigos
     */
    function getFriendCount(
        address _userAddress
    ) public view userExists(_userAddress) returns (uint256) {
        return users[_userAddress].friends.length;
    }

    /**
     * @dev Verifica si un nombre está disponible
     * @param _name Nombre a verificar
     * @return True si está disponible
     */
    function isNameAvailable(string memory _name) public view returns (bool) {
        return nameToAddress[_name] == address(0);
    }

    /**
     * @dev Obtiene la dirección de un usuario por su nombre
     * @param _name Nombre del usuario
     * @return Dirección del usuario
     */
    function getAddressByName(
        string memory _name
    ) public view returns (address) {
        return nameToAddress[_name];
    }

    /**
     * @dev Obtiene todos los usuarios registrados
     * @return Lista de todas las direcciones registradas
     */
    function getAllUsers() public view returns (address[] memory) {
        return allUsers;
    }

    /**
     * @dev Obtiene el número total de usuarios registrados
     * @return Número total de usuarios
     */
    function getTotalUsers() public view returns (uint256) {
        return allUsers.length;
    }

    /**
     * @dev Verifica si una dirección está registrada
     * @param _userAddress Dirección a verificar
     * @return True si está registrada
     */
    function isUserRegistered(address _userAddress) public view returns (bool) {
        return users[_userAddress].exists;
    }

    /**
     * @dev Cambia el nombre del usuario (msg.sender)
     * @param _newName Nuevo nombre del usuario
     */
    function changeName(
        string memory _newName
    ) public userExists(msg.sender) nameNotTaken(_newName) validName(_newName) {
        require(
            address(forestToken) != address(0),
            "ForestToken no configurado"
        );

        string memory oldName = users[msg.sender].name;

        // Quemar 10 tokens del usuario (10 * 10^18)
        uint256 burnAmount = 10 * 10 ** 18;
        forestToken.virtualBurn(msg.sender, burnAmount);

        // Remover el mapeo del nombre anterior
        delete nameToAddress[oldName];

        // Actualizar con el nuevo nombre
        users[msg.sender].name = _newName;
        nameToAddress[_newName] = msg.sender;

        emit NameChanged(msg.sender, oldName, _newName, block.timestamp);
    }

    /**
     * @dev Envía una solicitud de amistad
     * @param _to Dirección del usuario al que se envía la solicitud
     */
    function sendFriendRequest(
        address _to
    ) public userExists(msg.sender) userExists(_to) {
        require(msg.sender != _to, "No puedes enviarte solicitud a ti mismo");
        require(!users[msg.sender].isFriend[_to], "Ya es tu amigo");
        require(
            !friendRequests[msg.sender][_to],
            "Ya enviaste solicitud a este usuario"
        );

        friendRequests[msg.sender][_to] = true;

        emit FriendRequestSent(msg.sender, _to, block.timestamp);
    }

    /**
     * @dev Acepta una solicitud de amistad
     * @param _from Dirección del usuario que envió la solicitud
     */
    function acceptFriendRequest(
        address _from
    ) public userExists(msg.sender) userExists(_from) {
        require(
            friendRequests[_from][msg.sender],
            "No hay solicitud de este usuario"
        );
        require(!users[msg.sender].isFriend[_from], "Ya es tu amigo");

        // Agregar como amigos mutuamente
        users[msg.sender].friends.push(_from);
        users[msg.sender].isFriend[_from] = true;

        users[_from].friends.push(msg.sender);
        users[_from].isFriend[msg.sender] = true;

        // Remover la solicitud
        delete friendRequests[_from][msg.sender];

        emit FriendRequestAccepted(_from, msg.sender, block.timestamp);
        emit FriendAdded(msg.sender, _from, block.timestamp);
        emit FriendAdded(_from, msg.sender, block.timestamp);
    }

    // Métodos administrativos

    /**
     * @dev Registra un nuevo usuario (solo owner)
     * @param _from Dirección del usuario a registrar
     * @param _name Nombre único del usuario
     */
    function registerUserAdmin(
        address _from,
        string memory _name
    )
        public
        onlyOwner
        userNotExists(_from)
        nameNotTaken(_name)
        validName(_name)
    {
        User storage newUser = users[_from];
        newUser.name = _name;
        newUser.userAddress = _from;
        newUser.exists = true;
        newUser.createdAt = block.timestamp;

        nameToAddress[_name] = _from;
        allUsers.push(_from);

        emit UserRegistered(_from, _name, block.timestamp);
    }

    /**
     * @dev Remueve un amigo de la lista del usuario (solo owner)
     * @param _from Dirección del usuario
     * @param _friendAddress Dirección del amigo a remover
     */
    function removeFriendAdmin(
        address _from,
        address _friendAddress
    ) public onlyOwner userExists(_from) {
        require(users[_from].isFriend[_friendAddress], "No es tu amigo");

        // Remover de la lista de amigos
        address[] storage friends = users[_from].friends;
        for (uint i = 0; i < friends.length; i++) {
            if (friends[i] == _friendAddress) {
                friends[i] = friends[friends.length - 1];
                friends.pop();
                break;
            }
        }

        users[_from].isFriend[_friendAddress] = false;

        emit FriendRemoved(_from, _friendAddress, block.timestamp);
    }

    /**
     * @dev Cambia el nombre de un usuario (solo owner)
     * @param _userAddress Dirección del usuario
     * @param _newName Nuevo nombre del usuario
     */
    function changeNameAdmin(
        address _userAddress,
        string memory _newName
    )
        public
        onlyOwner
        userExists(_userAddress)
        nameNotTaken(_newName)
        validName(_newName)
    {
        require(
            address(forestToken) != address(0),
            "ForestToken no configurado"
        );

        string memory oldName = users[_userAddress].name;

        // Quemar 10 tokens del usuario (10 * 10^18)
        uint256 burnAmount = 10 * 10 ** 18;
        forestToken.virtualBurn(_userAddress, burnAmount);

        // Remover el mapeo del nombre anterior
        delete nameToAddress[oldName];

        // Actualizar con el nuevo nombre
        users[_userAddress].name = _newName;
        nameToAddress[_newName] = _userAddress;

        emit NameChanged(_userAddress, oldName, _newName, block.timestamp);
    }

    /**
     * @dev Envía una solicitud de amistad (solo owner)
     * @param _from Dirección del usuario que envía la solicitud
     * @param _to Dirección del usuario al que se envía la solicitud
     */
    function sendFriendRequestAdmin(
        address _from,
        address _to
    ) public onlyOwner userExists(_from) userExists(_to) {
        require(_from != _to, "No puedes enviarte solicitud a ti mismo");
        require(!users[_from].isFriend[_to], "Ya es tu amigo");
        require(
            !friendRequests[_from][_to],
            "Ya enviaste solicitud a este usuario"
        );

        friendRequests[_from][_to] = true;

        emit FriendRequestSent(_from, _to, block.timestamp);
    }

    /**
     * @dev Acepta una solicitud de amistad (solo owner)
     * @param _from Dirección del usuario que envió la solicitud
     * @param _to Dirección del usuario que acepta la solicitud
     */
    function acceptFriendRequestAdmin(
        address _from,
        address _to
    ) public onlyOwner userExists(_from) userExists(_to) {
        require(friendRequests[_from][_to], "No hay solicitud de este usuario");
        require(!users[_from].isFriend[_to], "Ya es tu amigo");

        // Agregar como amigos mutuamente
        users[_to].friends.push(_from);
        users[_to].isFriend[_from] = true;

        users[_from].friends.push(_to);
        users[_from].isFriend[_to] = true;

        // Remover la solicitud
        delete friendRequests[_from][_to];

        emit FriendRequestAccepted(_from, _to, block.timestamp);
        emit FriendAdded(_to, _from, block.timestamp);
        emit FriendAdded(_from, _to, block.timestamp);
    }
}
