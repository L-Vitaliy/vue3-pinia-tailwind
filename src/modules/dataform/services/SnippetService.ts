import { toRaw } from "vue";
import type {
  CallDataFieldSnippet,
  DataFieldDescriptor,
  DataFieldEmbedSnippets,
  DataFieldRenderer,
  DefineDataFieldSnippet,
} from "@/modules/dataform";

import { DataFormBuilder } from "@/modules/dataform/entities/DataFormBuilder";

import Password from "@/modules/dataform/views/snippets/Password.vue";
import FieldSet from "@/modules/dataform/views/snippets/FieldSet.vue";
import Switcher from "@/modules/dataform/views/snippets/Switcher.vue";

export class SnippetService<DTO extends object = object> {
  private _snippets: {
    [K in keyof DTO]?: DataFieldRenderer;
  } = {};

  private _embed: {
    [K in keyof DataFieldEmbedSnippets]: DataFieldRenderer<
      DataFieldEmbedSnippets[K]
    >;
  } = {
    password: { component: Password },
    fieldset: { component: FieldSet },
    switcher: { component: Switcher },
  };

  constructor(readonly builder: DataFormBuilder<DTO>) {}

  async load(): Promise<void> {
    const build = this.builder.getFormBuild();

    for (const field in build) {
      const dataField = build[field]!;

      this.intersectFieldSet(dataField);
      this.intersectSwitcher(dataField);

      const snippet = dataField.snippet;

      if (!snippet) continue;

      if (typeof snippet === "function") {
        this._snippets[field] = await (snippet as CallDataFieldSnippet<DTO>)(
          this.make.bind(this),
          dataField,
        );
        continue;
      }

      this.set(field, snippet);
    }
  }

  make<S extends DefineDataFieldSnippet>(
    snippet: S,
    props?: DataFieldRenderer<S>["props"],
  ): DataFieldRenderer<S> {
    const component =
      typeof snippet === "string"
        ? this._embed[snippet as keyof DataFieldEmbedSnippets].component
        : snippet;

    if (!snippet) {
      throw new Error(`Snippet ${snippet} is not defined in embed snippets.`);
    }

    return {
      component: component as any,
      props,
    };
  }

  get(field: keyof DTO): DataFieldRenderer | void {
    const snippet = this._snippets[field];

    if (!snippet) return;

    return {
      component: toRaw(snippet.component),
      props: toRaw(snippet.props),
    };
  }

  set<S extends DefineDataFieldSnippet>(
    field: keyof DTO,
    snippet: S,
    props?: DataFieldRenderer<S>["props"],
  ) {
    this._snippets[field] = this.make(snippet, props);
  }

  intersectFieldSet(data: DataFieldDescriptor<DTO>) {
    if (!data.fieldset?.length || !data.field) return;

    const fieldset = data.fieldset.filter(
      (field) => field in this.builder.fields && field !== data.field,
    ) as Array<keyof DTO>;

    this.builder.unsetFields(fieldset);

    data.snippet ||= (make) => {
      return make(this._embed.fieldset.component, {
        builder: this.builder,
        field: data.field as string,
        fields: data.fieldset as string[],
      });
    };
  }

  intersectSwitcher(data: DataFieldDescriptor<DTO>) {
    if (typeof data.switcher !== "function") return;

    data.snippet ||= (make) => {
      return make(this._embed.switcher.component, {
        builder: this.builder,
        field: data.field as string,
        onSwitch: (builder) => {
          const dataField = data.switcher!(builder) as DataFieldDescriptor<any>;

          dataField.readonly = data.readonly;

          return dataField;
        },
        ...data.switcherTexts,
      });
    };
  }
}
