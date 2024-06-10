import Repo from "@/api/service/Repo";
import type {
  NewUnitAttributes,
  UnitAttributes,
} from "@/modules/units/metadata/dataUnitAttributes";
import type { ResponseList } from "@/api/metadata/dataResponse";
import type { PaginationAttributes } from "@/api/metadata/attributes/dataAttributes";

export default class extends Repo {
  create(data: NewUnitAttributes) {
    return this.client.post(`/units`, data) as Promise<UnitAttributes>;
  }

  get(id: number) {
    return this.client.get(`/units/${id}`) as Promise<UnitAttributes>;
  }

  edit(data: UnitAttributes) {
    return this.client.put(
      `/units/${data.id}`,
      data,
    ) as Promise<UnitAttributes>;
  }

  delete(id: number) {
    return this.client.delete(`/units/${id}`) as Promise<UnitAttributes>;
  }

  list(args?: PaginationAttributes) {
    return this.client.get("/units", args) as ResponseList<UnitAttributes[]>;
  }
}
