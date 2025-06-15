import { useEffect, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { NFTContract } from "@/constants/thirdweb";

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export function useNFTMetadata(tokenId: bigint) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener URI del NFT
  const { data: uriData } = useReadContract({
    contract: NFTContract,
    method: "function tokenURI(uint256 tokenId) view returns (string memory)",
    params: [tokenId],
  });

  useEffect(() => {
    async function fetchMetadata() {
      if (!uriData) return;

      try {
        setIsLoading(true);
        setError(null);

        const uri = uriData.toString();
        const httpsUri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");

        const response = await fetch(httpsUri);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setMetadata(data);

        if (data.image) {
          const imageUri = data.image.replace(
            "ipfs://",
            "https://ipfs.io/ipfs/"
          );
          setImageUrl(imageUri);
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
        setError(err instanceof Error ? err.message : "Error loading metadata");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetadata();
  }, [uriData]);

  return {
    metadata,
    imageUrl,
    isLoading,
    error,
    uriData,
  };
}
