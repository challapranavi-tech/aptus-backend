import { getOdooClient } from "./client";

export type CreateOdooAttachmentInput = {
  resModel: string;
  resId: number;
  fileName: string;
  contentType: string;
  /** Base64-encoded file contents (Odoo `datas` field). */
  base64Content: string;
};

/**
 * Generic ir.attachment create — shared by bank-transfer proofs today and by
 * invoices / customer documents / ticket attachments later.
 */
export async function createOdooAttachment(
  input: CreateOdooAttachmentInput,
): Promise<number | null> {
  const client = getOdooClient();
  if (!client) return null;

  return client.create("ir.attachment", {
    name: input.fileName,
    datas: input.base64Content,
    res_model: input.resModel,
    res_id: input.resId,
    mimetype: input.contentType,
  });
}

export type OdooAttachmentListItem = {
  id: number;
  name: string;
  mimetype: string;
  createDate: string;
};

/** List attachments on an Odoo record (partner documents, invoices, tickets). */
export async function listOdooAttachments(
  resModel: string,
  resId: number,
  limit = 50,
): Promise<OdooAttachmentListItem[]> {
  const client = getOdooClient();
  if (!client) return [];

  const rows = await client.searchRead<{
    id: number;
    name: string;
    mimetype: string | false;
    create_date: string | false;
  }>(
    "ir.attachment",
    [
      ["res_model", "=", resModel],
      ["res_id", "=", resId],
    ],
    ["name", "mimetype", "create_date"],
    limit,
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    mimetype: typeof row.mimetype === "string" ? row.mimetype : "application/octet-stream",
    createDate: typeof row.create_date === "string" ? row.create_date : "",
  }));
}
