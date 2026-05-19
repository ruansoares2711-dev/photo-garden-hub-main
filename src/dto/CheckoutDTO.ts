/** DTO trocado entre client e server para checkout / downloads. */
export interface CreateCheckoutInput {
  origin: string;
}

export interface CreateCheckoutOutput {
  purchaseId: string;
  initPoint: string;
}

export interface DownloadUrlInput {
  photoId: string;
}

export interface DownloadUrlOutput {
  url: string;
}
