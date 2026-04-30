
export interface UploadMedia {
  id: string;
  owner: string;
  filename: string;
  mime: string;
  size: number;
  checksum: string;
  created_at: number;
}


export type UploadMediaResult = BaseApiResult<UploadMedia>
