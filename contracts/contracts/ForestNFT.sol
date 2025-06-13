// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ForestNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    enum Rarity {
        NORMAL,
        RARE,
        LEGENDARY
    }

    mapping(uint256 => Rarity) public tokenRarity;
    mapping(address => mapping(Rarity => uint256)) public userNFTsByRarity;
    mapping(address => uint256) public userParcels; // Cantidad de parcelas por usuario

    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    uint256 public constant TREES_PER_PARCEL = 16; // Máximo de árboles por parcela

    constructor() ERC721("Forest NFT", "FORESTNFT") Ownable() {}

    // Nueva función mint con amount (escalado por 10, ej: 1.2 => 12)
    function mintTo(address to, uint256 amountScaled) public onlyOwner {
        require(
            amountScaled >= 12 && amountScaled <= 65,
            "Amount must be between 1.2 and 6.5 tokens (scaled by 10)"
        );

        // Verificar que el usuario tenga suficientes parcelas
        uint256 currentTrees = balanceOf(to);
        uint256 maxTreesAllowed = userParcels[to] * TREES_PER_PARCEL;
        require(
            currentTrees < maxTreesAllowed,
            "Not enough parcels to mint more trees"
        );

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        Rarity rarity = determineRarity(amountScaled);
        tokenRarity[newTokenId] = rarity;

        string memory uri = createTokenURI(rarity);
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);
    }

    // Probabilidad dinámica según la cantidad stakeada
    function determineRarity(
        uint256 amountScaled
    ) internal view returns (Rarity) {
        // Escalar a rango -15 a +15
        // amountScaled va de 12 (1.2 tokens) a 65 (6.5 tokens)
        int256 adjustment = int256((amountScaled - 12) * 30) / 53 - 15; // de -15 a +15 aprox.

        // Base chances
        int256 baseNormal = 60;
        int256 baseRare = 25;
        int256 baseLegendary = 15;

        int256 normalChance = baseNormal - adjustment; // más amount => menos normal
        int256 rareChance = baseRare + adjustment / 2; // más amount => más rare
        int256 legendaryChance = baseLegendary + adjustment / 2; // más amount => más legendary

        uint256 finalNormal = clampChance(normalChance);
        uint256 finalRare = clampChance(rareChance);
        uint256 finalLegendary = clampChance(legendaryChance);

        uint256 total = finalNormal + finalRare + finalLegendary;

        // Protección contra total = 0 para evitar underflow
        if (total == 0) {
            // Fallback a probabilidades por defecto
            finalNormal = 60;
            finalRare = 25;
            finalLegendary = 15;
            total = 100;
        }

        uint256 random = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        ) % total;

        if (random < finalLegendary) {
            return Rarity.LEGENDARY;
        } else if (random < finalLegendary + finalRare) {
            return Rarity.RARE;
        } else {
            return Rarity.NORMAL;
        }
    }

    function clampChance(int256 value) internal pure returns (uint256) {
        if (value < 0) return 0;
        return uint256(value);
    }

    function createTokenURI(
        Rarity rarity
    ) internal pure returns (string memory) {
        if (rarity == Rarity.LEGENDARY) {
            return "ipfs://Qmbp2p52AfBnqs1VAydDDvPddaVjn1zufuGuSfy8J5sLGc";
        } else if (rarity == Rarity.RARE) {
            return "ipfs://QmURmmL4nbEWk5FQ79qnAoziNuRMPCoVdCucdoX9P2FQXW";
        } else {
            return "ipfs://QmNa6gzhekEgEH1oov7Ua5jPTp9FPwfX5WA2X44kkswhDg";
        }
    }

    function getNFTsByRarity(
        address user,
        Rarity rarity
    ) public view returns (uint256) {
        return userNFTsByRarity[user][rarity];
    }

    function tokensOfOwner(
        address owner
    ) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    // Función para asignar parcelas a un usuario
    function assignParcels(address user, uint256 parcels) public onlyOwner {
        require(parcels > 0, "Parcels must be greater than 0");
        userParcels[user] = parcels;
    }

    // Función para aumentar las parcelas de un usuario
    function addParcels(
        address user,
        uint256 additionalParcels
    ) public onlyOwner {
        require(
            additionalParcels > 0,
            "Additional parcels must be greater than 0"
        );
        userParcels[user] += additionalParcels;
    }

    // Función para consultar las parcelas de un usuario
    function getUserParcels(address user) public view returns (uint256) {
        return userParcels[user];
    }

    // Función para consultar cuántos árboles más puede plantar un usuario
    function getAvailableTreeSlots(address user) public view returns (uint256) {
        uint256 currentTrees = balanceOf(user);
        uint256 maxTreesAllowed = userParcels[user] * TREES_PER_PARCEL;

        if (currentTrees >= maxTreesAllowed) {
            return 0;
        }

        return maxTreesAllowed - currentTrees;
    }

    // Función para verificar si un usuario puede plantar más árboles
    function canPlantMoreTrees(address user) public view returns (bool) {
        uint256 currentTrees = balanceOf(user);
        uint256 maxTreesAllowed = userParcels[user] * TREES_PER_PARCEL;
        return currentTrees < maxTreesAllowed;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 /* batchSize */
    ) internal virtual override {
        if (from != address(0)) {
            userNFTsByRarity[from][tokenRarity[tokenId]]--;

            uint256 lastIndex = _ownedTokens[from].length - 1;
            uint256 tokenIndex = _ownedTokensIndex[tokenId];

            if (tokenIndex != lastIndex) {
                uint256 lastTokenId = _ownedTokens[from][lastIndex];
                _ownedTokens[from][tokenIndex] = lastTokenId;
                _ownedTokensIndex[lastTokenId] = tokenIndex;
            }

            _ownedTokens[from].pop();
            delete _ownedTokensIndex[tokenId];
        }

        if (to != address(0)) {
            userNFTsByRarity[to][tokenRarity[tokenId]]++;
            _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
            _ownedTokens[to].push(tokenId);
        }
    }
}
