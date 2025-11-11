import dayjs from "dayjs";
import { DEFAULT_NODE_DATE_FORMAT, TWO } from "../../../../../../util/constants";
import { formatAmountToFraction, formatAmountToWords, toNumber } from "../../../../../../util/currency.util";
import { convertToNodeDateFormat } from "../../../../../../util/date.util";
import { PurchaseReturnItemRequest, PurchaseReturnItemTaxRequest, PurchaseReturnRequest } from "../../../store/purchase-return/purchase-return-request.type";
import { PurchaseReturn } from "../../../store/purchase-return/purchase-return.model";
import { PurchaseReturnPurchaseInvoiceFormValue, PurchaseReturnFormValue, PurchaseReturnPropertiesFormValue, PurchaseReturnSummaryFormValue, PurchaseReturnTaxDisplayModeType, PurchaseReturnItemFormValue, PurchaseReturnItemTaxFormValue } from "./purchase-return-form.type";

export const mapPurchaseReturnItemTaxFormValueToRequest = (formValue: PurchaseReturnItemTaxFormValue): PurchaseReturnItemTaxRequest => {
  const name = formValue.name;
  const shortname = formValue.shortname;
  const rate = toNumber(formValue.rate);
  const appliedto = toNumber(formValue.appliedto);
  const amount = toNumber(formValue.amount);
  const taxid = formValue.tax.id!;
  return {
    name,
    shortname,
    rate,
    appliedto,
    amount,
    taxid,
  };
};

export const mapPurchaseReturnItemFormValueToRequest = (formValue: PurchaseReturnItemFormValue, order: number): PurchaseReturnItemRequest => {
  const item = formValue.item;
  const name = formValue.name ?? item.name;
  const displayname = formValue.displayname ?? item.displayname ?? item.name;
  const description = formValue.description ?? item.description;
  const code = formValue.code ?? item.code ?? item.category.code;
  const price = toNumber(formValue.price);
  const quantity = toNumber(formValue.quantity);
  const itemtotal = toNumber(formValue.itemtotal);
  const taxamount = toNumber(formValue.taxamount);
  const grandtotal = toNumber(formValue.grandtotal);
  const itemid = formValue.item.id!;
  const taxes = formValue.taxes.map(tax => mapPurchaseReturnItemTaxFormValueToRequest(tax));
  return {
    name,
    ...(description ? { description } : {}),
    ...(displayname ? { displayname } : {}),
    order,
    code,
    price,
    quantity,
    itemtotal,
    ...(taxamount ? { taxamount } : {}),
    grandtotal,
    itemid,
    taxes,
  };
};

export const mapPurchaseReturnFormValueToRequest = (formValue: PurchaseReturnFormValue): PurchaseReturnRequest => {
  const number = formValue.properties.number;
  const date = convertToNodeDateFormat(formValue.properties.date);
  const duedate = convertToNodeDateFormat(formValue.properties.duedate);
  const itemtotal = toNumber(formValue.summary.itemtotal);
  const tax = toNumber(formValue.summary.tax);
  const roundoff = toNumber(formValue.summary.roundoff);
  const grandtotal = toNumber(formValue.summary.grandtotal);
  const currencycode = formValue.properties.currency.code;
  const purchaseinvoiceid = formValue.purchaseinvoice.purchaseinvoice.id!;
  const taxoption = formValue.properties.taxoption;
  const taxdisplaymode = formValue.taxDisplayMode;
  const showdescription = formValue.showDescription;
  const items = formValue.items.map((item, index) => mapPurchaseReturnItemFormValueToRequest(item, index + 1));
  return {
    number,
    date,
    duedate,
    itemtotal,
    tax,
    ...(roundoff ? { roundoff } : {}),
    grandtotal,
    currencycode,
    purchaseinvoiceid,
    items,
    cprops: {
      taxdisplaymode,
      showdescription,
      taxoption,
    },
  };
};

export const findTaxColumnCount = (taxDisplayMode: PurchaseReturnTaxDisplayModeType): number => {
  if([PurchaseReturnTaxDisplayModeType.IGST].includes(taxDisplayMode)) {
    return 1;
  }else if([PurchaseReturnTaxDisplayModeType.CGST_SGST, PurchaseReturnTaxDisplayModeType.IGST_CESS].includes(taxDisplayMode)) {
    return 2;
  }else if([PurchaseReturnTaxDisplayModeType.CGST_SGST_CESS].includes(taxDisplayMode)) {
    return 3;
  }
  return 0;
}

type Maybe<T> = T | null | undefined;

const mapTaxes = (item: any): PurchaseReturnItemTaxFormValue[] => {
  const taxes = Array.isArray(item?.taxes) ? item.taxes : [];
  return taxes.map((t: any): PurchaseReturnItemTaxFormValue => ({
    rate: toNumber(t?.rate),
    appliedto: toNumber(t?.appliedto),
    amount: toNumber(t?.amount),
    name: t?.name ?? '',
    shortname: t?.shortname ?? '',
    tax: t?.tax,
  }));
};

const mapItem = (item: any, fractions: number): PurchaseReturnItemFormValue => ({
  name: item?.name ?? item?.item?.name ?? '',
  displayname: item?.displayname ?? item?.item?.displayname ?? undefined,
  description: item?.description ?? undefined,
  code: item?.code ?? item?.item?.code ?? '',
  price: formatAmountToFraction(item?.price, fractions),
  quantity: formatAmountToFraction(item?.quantity, fractions),
  itemtotal: formatAmountToFraction(item?.itemtotal, fractions),
  taxes: mapTaxes(item),
  taxamount: item?.taxamount ?? null,
  grandtotal: formatAmountToFraction(item?.grandtotal, fractions),
  item: item?.item,
});

const mapPurchaseInvoiceBlock = (pr: PurchaseReturn): PurchaseReturnPurchaseInvoiceFormValue => {
  return {
    purchaseinvoice: pr.purchaseinvoice,
  };
};

const mapSummary = (pr: PurchaseReturn, fractions: number): PurchaseReturnSummaryFormValue => {
  const grandtotal = toNumber(pr?.grandtotal);
  return {
    itemtotal: formatAmountToFraction(pr?.itemtotal, fractions),
    tax: formatAmountToFraction(pr?.tax, fractions),
    roundoff: formatAmountToFraction(pr?.roundoff, fractions),
    grandtotal: formatAmountToFraction(grandtotal, fractions),
    words: formatAmountToWords(grandtotal, pr?.currency),
  };
};

const mapProperties = (pr: PurchaseReturn): PurchaseReturnPropertiesFormValue => ({
  number: pr.number,
  date: dayjs(pr.date).format(DEFAULT_NODE_DATE_FORMAT),
  duedate: dayjs(pr.duedate).format(DEFAULT_NODE_DATE_FORMAT),
  currency: pr.currency,
  taxoption: pr?.cprops?.taxoption ?? 'Intra State',
  journal: pr?.sprops?.journal ?? '',
});

export function purchaseReturnModelToPurchaseReturnFormValue(pr: PurchaseReturn): PurchaseReturnFormValue {
  const fractions = pr?.currency?.minorunit ?? TWO;
  return {
    taxDisplayMode: pr?.cprops?.taxdisplaymode ?? PurchaseReturnTaxDisplayModeType.CGST_SGST,
    showDescription: pr?.cprops?.showdescription ?? false,
    purchaseinvoice: mapPurchaseInvoiceBlock(pr),
    properties: mapProperties(pr),
    items: Array.isArray(pr?.items) ? pr.items!.map(item => mapItem(item, fractions)) : [],
    summary: mapSummary(pr, fractions),
  };
}

