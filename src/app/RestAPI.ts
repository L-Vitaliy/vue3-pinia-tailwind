import { request } from "@/api/service/Request";
import { AppServiceContractor } from "@/app/AppServiceContractor";

export type RestAPIEntry = {
  [k: string]: (...args) => Promise<any>;
};

export type RestAPIEntryValue<
  T extends RestAPIInterface,
  K extends keyof T["restAPI"],
> = Awaited<ReturnType<T["restAPI"][K]>>;

export type RestAPIDataAwaited<T extends RestAPIInterface> = {
  [K in keyof T["restAPI"]]: RestAPIEntryValue<T, K>;
};

export interface RestAPIInterface {
  readonly restAPI: RestAPIEntry;

  fetch(...args): this["restAPI"];
}

export abstract class RestAPI
  extends AppServiceContractor
  implements RestAPIInterface
{
  abstract readonly restAPI: RestAPIEntry;

  private _restAPIData: Partial<{
    [K in keyof this["restAPI"]]: RestAPIEntryValue<this, K>;
  }> = {};

  private declare _restAPI: this["restAPI"];

  readonly onFetched: Partial<{
    [K in keyof this["restAPI"]]: Array<
      (value: RestAPIEntryValue<this, K>) => any
    >;
  }> = {};

  fetch(): this["restAPI"] {
    if (!this._restAPI) {
      this._restAPI = {};

      for (const entry of Object.keys(this.restAPI)) {
        (<object>this._restAPI)[entry] = (...args) => {
          return this.restAPI[entry].apply(this, args).then((value) => {
            const data = this._restAPIData as object;

            data[entry] =
              typeof value === "object" && typeof data[entry] === "object"
                ? value.constructor === Object &&
                  data[entry].constructor === Object
                  ? { ...data[entry], ...value }
                  : Array.isArray(data[entry]) && Array.isArray(value)
                    ? [...data[entry], ...value]
                    : value
                : value;

            for (const listen of this.onFetched[entry] ?? []) {
              listen(value);
            }

            return data[entry];
          });
        };
      }
    }

    return this._restAPI;
  }

  get data(): Partial<RestAPIDataAwaited<this>> {
    return this._restAPIData;
  }

  get request() {
    return request;
  }

  isFetched<K extends keyof this["restAPI"]>(entry: K) {
    return typeof this._restAPIData[entry] === "object"
      ? Object.keys(this._restAPIData[entry] as object).length > 0
      : !!this._restAPIData[entry];
  }

  /* https://stackoverflow.com/questions/65512526/cannot-stringify-arbitrary-non-pojos-and-invalid-prop-type-check-failed-for */
  toJSON() {
    return { ...this };
  }
}
