// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ForestNFT.sol";
import "./ForestToken.sol";

contract Marketplace is Ownable, ReentrancyGuard {
    // Interfaces to other contracts
    ForestNFT public forestNFT;
    ForestToken public forestToken;

    // Marketplace fee percentage (e.g., 5%)
    uint256 public marketplaceFee = 5;

    // Listing structure
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price; // Price in ForestToken
        bool isActive;
        uint256 listedAt;
    }

    // Mappings
    mapping(uint256 => Listing) public listings; // tokenId => Listing
    mapping(address => uint256[]) public userListings; // seller => tokenIds
    mapping(uint256 => uint256) public listingIndex; // tokenId => index in userListings

    // Active listings array for easy enumeration
    uint256[] public activeListings;
    mapping(uint256 => uint256) public activeListingIndex; // tokenId => index in activeListings

    // Events
    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );

    event NFTUnlisted(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 timestamp
    );

    event NFTSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 fee,
        uint256 timestamp
    );

    event MarketplaceFeeUpdated(uint256 newFee);

    constructor(address _forestNFT, address _forestToken) Ownable() {
        forestNFT = ForestNFT(_forestNFT);
        forestToken = ForestToken(_forestToken);
    }

    // Modifier to check if address is the seller of a listing
    modifier onlySeller(address seller, uint256 tokenId) {
        require(listings[tokenId].seller == seller, "Not the seller");
        _;
    }

    // Modifier to check if listing is active
    modifier onlyActiveListing(uint256 tokenId) {
        require(listings[tokenId].isActive, "Listing not active");
        _;
    }

    // List an NFT for sale (called by backend with user address)
    function listNFT(
        address seller,
        uint256 tokenId,
        uint256 price
    ) external onlyOwner nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].isActive, "NFT already listed");

        // Check if seller owns the token in ForestNFT internal system
        address tokenOwner = forestNFT.getTokenOwner(tokenId);
        require(tokenOwner == seller, "Seller doesn't own this NFT");

        // Create listing
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: seller,
            price: price,
            isActive: true,
            listedAt: block.timestamp
        });

        // Add to user listings
        userListings[seller].push(tokenId);
        listingIndex[tokenId] = userListings[seller].length - 1;

        // Add to active listings
        activeListings.push(tokenId);
        activeListingIndex[tokenId] = activeListings.length - 1;

        emit NFTListed(tokenId, seller, price, block.timestamp);
    }

    // Unlist an NFT (called by backend with user address)
    function unlistNFT(
        address seller,
        uint256 tokenId
    )
        external
        onlyOwner
        nonReentrant
        onlySeller(seller, tokenId)
        onlyActiveListing(tokenId)
    {
        _removeListing(tokenId);
        emit NFTUnlisted(tokenId, seller, block.timestamp);
    }

    // Buy an NFT (called by backend with buyer address)
    function buyNFT(
        address buyer,
        uint256 tokenId
    ) external onlyOwner nonReentrant onlyActiveListing(tokenId) {
        Listing memory listing = listings[tokenId];
        require(listing.seller != buyer, "Cannot buy your own NFT");

        // Check buyer has enough virtual balance
        uint256 buyerBalance = forestToken.virtualBalance(buyer);
        require(buyerBalance >= listing.price, "Insufficient token balance");

        // Calculate marketplace fee
        uint256 fee = (listing.price * marketplaceFee) / 100;
        uint256 sellerAmount = listing.price - fee;

        // Transfer tokens (virtual balance)
        // From buyer to seller
        forestToken.virtualTransfer(buyer, listing.seller, sellerAmount);

        // Fee to marketplace owner
        if (fee > 0) {
            forestToken.virtualTransfer(buyer, owner(), fee);
        }

        // Transfer NFT ownership in ForestNFT internal system
        forestNFT.transferTokenBetweenUsers(listing.seller, buyer, tokenId);

        // Remove listing
        _removeListing(tokenId);

        emit NFTSold(
            tokenId,
            listing.seller,
            buyer,
            listing.price,
            fee,
            block.timestamp
        );
    }

    // Update listing price (called by backend with seller address)
    function updateListingPrice(
        address seller,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        onlyOwner
        onlySeller(seller, tokenId)
        onlyActiveListing(tokenId)
    {
        require(newPrice > 0, "Price must be greater than 0");

        listings[tokenId].price = newPrice;

        emit NFTListed(tokenId, seller, newPrice, block.timestamp);
    }

    // Internal function to remove a listing
    function _removeListing(uint256 tokenId) internal {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Listing not active");

        // Mark as inactive
        listing.isActive = false;

        // Remove from user listings
        address seller = listing.seller;
        uint256 index = listingIndex[tokenId];
        uint256 lastIndex = userListings[seller].length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = userListings[seller][lastIndex];
            userListings[seller][index] = lastTokenId;
            listingIndex[lastTokenId] = index;
        }
        userListings[seller].pop();
        delete listingIndex[tokenId];

        // Remove from active listings
        uint256 activeIndex = activeListingIndex[tokenId];
        uint256 lastActiveIndex = activeListings.length - 1;

        if (activeIndex != lastActiveIndex) {
            uint256 lastActiveTokenId = activeListings[lastActiveIndex];
            activeListings[activeIndex] = lastActiveTokenId;
            activeListingIndex[lastActiveTokenId] = activeIndex;
        }
        activeListings.pop();
        delete activeListingIndex[tokenId];
    }

    // Get user's active listings
    function getUserListings(
        address user
    ) external view returns (uint256[] memory) {
        return userListings[user];
    }

    // Get all active listings
    function getActiveListings() external view returns (uint256[] memory) {
        return activeListings;
    }

    // Get listing details
    function getListing(
        uint256 tokenId
    ) external view returns (Listing memory) {
        return listings[tokenId];
    }

    // Get active listings with details (paginated)
    function getActiveListingsWithDetails(
        uint256 offset,
        uint256 limit
    ) external view returns (Listing[] memory) {
        uint256 total = activeListings.length;

        if (offset >= total) {
            return new Listing[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        Listing[] memory result = new Listing[](end - offset);

        for (uint256 i = offset; i < end; i++) {
            uint256 tokenId = activeListings[i];
            result[i - offset] = listings[tokenId];
        }

        return result;
    }

    // Get NFT details with rarity
    function getNFTDetails(
        uint256 tokenId
    )
        external
        view
        returns (
            address owner,
            ForestNFT.Rarity rarity,
            string memory tokenURI,
            bool isListed,
            uint256 price
        )
    {
        owner = forestNFT.getTokenOwner(tokenId);
        rarity = forestNFT.tokenRarity(tokenId);
        tokenURI = forestNFT.tokenURI(tokenId);
        isListed = listings[tokenId].isActive;
        price = isListed ? listings[tokenId].price : 0;
    }

    // Get user's NFTs with listing status
    function getUserNFTsWithListingStatus(
        address user
    )
        external
        view
        returns (
            uint256[] memory tokenIds,
            bool[] memory isListedArray,
            uint256[] memory prices
        )
    {
        uint256[] memory userTokens = forestNFT.tokensOfOwner(user);
        uint256 length = userTokens.length;

        tokenIds = new uint256[](length);
        isListedArray = new bool[](length);
        prices = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = userTokens[i];
            tokenIds[i] = tokenId;
            isListedArray[i] = listings[tokenId].isActive;
            prices[i] = listings[tokenId].isActive
                ? listings[tokenId].price
                : 0;
        }
    }

    // Check if user can buy a specific NFT
    function canBuyNFT(
        address user,
        uint256 tokenId
    ) external view returns (bool) {
        Listing memory listing = listings[tokenId];

        if (!listing.isActive || listing.seller == user) {
            return false;
        }

        uint256 userBalance = forestToken.virtualBalance(user);
        return userBalance >= listing.price;
    }

    // Owner functions
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 10, "Fee cannot exceed 10%");
        marketplaceFee = _fee;
        emit MarketplaceFeeUpdated(_fee);
    }

    function updateForestNFTContract(address _forestNFT) external onlyOwner {
        forestNFT = ForestNFT(_forestNFT);
    }

    function updateForestTokenContract(
        address _forestToken
    ) external onlyOwner {
        forestToken = ForestToken(_forestToken);
    }

    // Emergency function to remove invalid listings
    function removeInvalidListing(uint256 tokenId) external onlyOwner {
        require(listings[tokenId].isActive, "Listing not active");

        // Check if the seller still owns the NFT
        address currentOwner = forestNFT.getTokenOwner(tokenId);
        if (currentOwner != listings[tokenId].seller) {
            _removeListing(tokenId);
        }
    }

    // Get marketplace statistics
    function getMarketplaceStats()
        external
        view
        returns (
            uint256 totalActiveListings,
            uint256 /* totalListingsEver */,
            uint256 currentFee
        )
    {
        totalActiveListings = activeListings.length;
        // Note: totalListingsEver would need additional tracking
        currentFee = marketplaceFee;
    }
}
