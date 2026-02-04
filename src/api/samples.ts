import api, { type ApiResponse } from "@/api/client";
import type {
  SampleDetail,
  SampleListItem,
  SamplesCreateBody,
  SamplesUpdateBody,
} from "@/types/sample";

export type SamplesGetListQuery = {
  page?: number;
  itemsPerPage?: number;

  receiptId?: string;
  status?: string;

  search?: string;

  [key: string]: unknown;
};

export type SamplesGetListInput = {
  query?: SamplesGetListQuery;
};

export async function samplesGetList(
  input: SamplesGetListInput = {}
): Promise<ApiResponse<SampleListItem[]>> {
  return api.get<SampleListItem[]>("/v2/samples/get/list", {
    query: input.query ?? {},
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export type SamplesGetFullInput = { sampleId: string };

export async function samplesGetFull(
  input: SamplesGetFullInput
): Promise<ApiResponse<SampleDetail>> {
  return api.get<SampleDetail>("/v2/samples/get/full", {
    query: input,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function samplesCreate(
  body: SamplesCreateBody
): Promise<ApiResponse<SampleDetail>> {
  return api.post<SampleDetail, SamplesCreateBody>("/v2/samples/create", {
    body,
  });
}

export async function samplesUpdate(
  body: SamplesUpdateBody
): Promise<ApiResponse<SampleDetail>> {
  return api.post<SampleDetail, SamplesUpdateBody>("/v2/samples/update", {
    body,
  });
}
