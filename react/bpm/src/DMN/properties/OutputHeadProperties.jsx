import React, { useEffect, useMemo, useState } from "react";

import { TYPES } from "../constants";
import { getAllModels, getMetaFields, getNameColumn } from "../../services/api";
import {
  TextField,
  SelectBox,
  FieldEditor,
  DatePicker,
} from "../../components/properties/components";
import { Selection } from "../../components/expression-builder/components";
import { translate, lowerCaseFirstLetter, getLowerCase } from "../../utils";
import { RELATIONAL_TYPES, ALL_TYPES } from "../constants";
import { getNameField } from "../services/api";
import AlertDialog from "../../components/AlertDialog";
import Tooltip from "../../components/Tooltip";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Box,
} from "@axelor/ui";
import { BooleanRadio } from "../../components/BooleanRadio";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import styles from "./OutputHeadProperties.module.css";

export default function OutputHeadProperties({
  element,
  output: propOutput,
  dmnModeler,
  getData,
  getNameCol,
}) {
  const [output, setOutput] = useState(null);
  const [openOutputExpression, setOpenOutputExpression] = useState(false);
  const [outputField, setOutputField] = useState(null);
  const [metaField, setMetaField] = useState(null);
  const [relationalField, setRelationalField] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [valueFrom, setValueFrom] = useState("context");
  const [model, setModel] = useState(null);
  const [contextModel, setContextModel] = useState(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  const models = useMemo(() => getData && getData(), [getData]);
  const [type, setType] = useState("string");
  const [defaultValue, setDefaultValue] = useState(null);

  const setProperty = React.useCallback(
    (context, field) => {
      const activeEditor = dmnModeler.getActiveViewer();
      const modeling = activeEditor.get("modeling");
      modeling.updateProperties(field, context);
    },
    [dmnModeler]
  );

  const getModels = React.useCallback((e) => {
    const criteria = [];
    if (e && e.search) {
      criteria.push({
        fieldName: "name",
        operator: "like",
        value: e.search,
      });
    }
    return getAllModels(e?.search ? { criteria } : null);
  }, []);

  const handleOk = async () => {
    if (!output) return;
    setProperty({ "camunda:valueFrom": valueFrom }, output);
    if (valueFrom === "context") {
      let typeRef = "string";
      const model = lowerCaseFirstLetter(contextModel?.name);
      let text =
        outputField && model && outputField !== ""
          ? `${model}.${outputField}`
          : undefined;
      setReadOnly(allFields?.length ? true : false);
      const type = metaField && metaField.type && metaField.type.toLowerCase();
      if (ALL_TYPES.includes(type)) {
        typeRef = type;
      } else if (RELATIONAL_TYPES.includes(type)) {
        const { targetName, model, jsonTarget } = metaField || {};
        let nameColumn = targetName;
        if (model === "com.axelor.meta.db.MetaJsonRecord" && jsonTarget) {
          let fieldData = await getNameField(jsonTarget);
          nameColumn =
            fieldData && fieldData.name ? fieldData.name : targetName;
        }
        text =
          nameColumn && !text?.includes(nameColumn)
            ? `${text}.${nameColumn}`
            : text;
      } else if (["date", "datetime", "time"].includes(type)) {
        typeRef = "date";
      } else if (type === "decimal") {
        typeRef = "decimal";
      }
      let context = {
        typeRef,
        "camunda:text": text,
        "camunda:textMetaField": JSON.stringify(metaField || undefined),
        "camunda:allFields": JSON.stringify(allFields || undefined),
        "camunda:relationalField":
          metaField?.type !== "BOOLEAN"
            ? JSON.stringify(relationalField || undefined)
            : undefined,
      };
      setType(typeRef);
      setProperty(context, output);
    } else if (valueFrom === "model") {
      setReadOnly(outputField ? true : false);
      const text = outputField && model ? outputField : undefined;
      let context = {
        typeRef: "string",
        "camunda:text": text,
        "camunda:textMetaField": JSON.stringify(model || undefined),
        "camunda:allFields": undefined,
        "camunda:relationalField": undefined,
      };
      setProperty(context, output);
      // nameColumn
      const nameColumn = await getNameColumn(model?.fullName || model?.name);
      getNameCol && getNameCol(nameColumn);
    }
    setContextModel(null);
    setModel(null);
    setOutputField(null);
    setMetaField(null);
    setAllFields([]);
    setRelationalField(null);
  };

  const handleClickOpen = () => {
    setOpenOutputExpression(true);

    //refill values
    const attrs = output && output.$attrs;
    const from = attrs["camunda:valueFrom"] || "context";
    const textMetaField = attrs["camunda:textMetaField"];

    setValueFrom(from);
    if (models?.length === 1) setContextModel(models[0]);

    if (from === "model") {
      const model = textMetaField ? JSON.parse(textMetaField) : undefined;
      setModel(model);
      setOutputField(model?.name || "");
    } else {
      const allFields = attrs["camunda:allFields"];
      setAllFields(allFields ? JSON.parse(allFields) : []);
      const relationalField = attrs["camunda:relationalField"];
      setRelationalField(
        relationalField ? JSON.parse(relationalField) : undefined
      );
      setMetaField(textMetaField ? JSON.parse(textMetaField) : undefined);
      if (!allFields) return;

      const text = attrs["camunda:text"];
      const textValues = text && text.split(".");
      const modelName = textValues && textValues[0];
      const value =
        textValues && textValues.length > 0
          ? textValues.slice(1).join(".")
          : text;
      setOutputField(value);
      if (models?.length > 1) {
        const model =
          modelName &&
          models?.find((m) => getLowerCase(m.name) === getLowerCase(modelName));
        setContextModel(model);
      }
    }
  };

  useEffect(() => {
    setOutput(propOutput);
    setType(propOutput.typeRef);
    const attrs = propOutput && propOutput.$attrs;
    const textMetaField = attrs["camunda:textMetaField"];
    const allFields = attrs["camunda:allFields"];
    const valueFrom = attrs["camunda:valueFrom"];
    const text = attrs["camunda:text"];
    const defaultValue = attrs["camunda:defaultValue"];
    setDefaultValue(defaultValue);
    setValueFrom(valueFrom || "context");
    if (valueFrom === "model") {
      setReadOnly(textMetaField ? true : false);
    } else {
      const textValues = text && text.split(".");
      const modelName = textValues && textValues[0];
      const isPresent = models?.find(
        (m) => getLowerCase(m.name) === getLowerCase(modelName)
      )?.name;
      setReadOnly(allFields ? true : false);

      // model is removed from view drd
      if (!isPresent && allFields) {
        setReadOnly(false);
        setType("string");
        setProperty(
          {
            typeRef: "string",
            "camunda:textMetaField": undefined,
            "camunda:relationalField": undefined,
            "camunda:allFields": undefined,
          },
          propOutput
        );
      }
    }
  }, [propOutput, models, setProperty]);

  const alertClose = () => {
    setOpenAlert(false);
  };

  const handleAlertOk = () => {
    setOpenAlert(false);
    setReadOnly(false);
    setType("string");

    setProperty(
      {
        typeRef: "string",
        "camunda:textMetaField": undefined,
        "camunda:relationalField": undefined,
        "camunda:allFields": undefined,
        "camunda:defaultValue": undefined,
        "camunda:valueFrom": undefined,
      },
      output
    );
  };

  return (
    <React.Fragment>
      <TextField
        element={element}
        entry={{
          id: "label",
          label: translate("Label"),
          modelProperty: "label",
          get: function () {
            return {
              label: output && output.label,
            };
          },
          set: function (e, values) {
            let currentVal = values["label"];
            setProperty({ label: currentVal }, output);
          },
        }}
        canRemove={true}
      />
      <TextField
        element={element}
        entry={{
          id: "expression",
          label: translate("Expression"),
          modelProperty: "expression",
          get: function () {
            return {
              expression:
                output && output.$attrs && output.$attrs["camunda:text"],
            };
          },
          set: function (e, values) {
            let currentVal = values["expression"];
            (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
            if (!currentVal) {
              setProperty(
                {
                  "camunda:textMetaField": undefined,
                  "camunda:relationalField": undefined,
                  "camunda:allFields": undefined,
                  "camunda:valueFrom": undefined,
                  typeRef: "string",
                },
                output
              );
            }
            setProperty(
              {
                "camunda:text":
                  currentVal && currentVal !== "" ? currentVal : undefined,
              },
              output
            );
          },
        }}
        readOnly={readOnly}
        canRemove={true}
        endAdornment={
          <>
            <Tooltip title="Enable" aria-label="enable">
              <MaterialIcon
                icon="do_not_disturb"
                className={styles.newIcon}
                onClick={() => readOnly && setOpenAlert(true)}
              />
            </Tooltip>
            <MaterialIcon
              icon="edit"
              className={styles.newIcon}
              onClick={handleClickOpen}
            />
          </>
        }
      />

      <Dialog
        open={openOutputExpression}
        backdrop
        centered
        className={styles.dialog}
      >
        <DialogHeader onCloseClick={() => setOpenOutputExpression(false)}>
          <h3>{translate("Expression")}</h3>
        </DialogHeader>
        <DialogContent className={styles.dialogContent}>
          <BooleanRadio
            name="radioType"
            onChange={(e) => setValueFrom(e?.target?.value)}
            data={[
              { value: "context", label: "Context" },
              { value: "model", label: "Model" },
            ]}
            value={valueFrom || "context"}
          />
          <Box d="flex" w={100} overflow="auto">
            {valueFrom === "model" ? (
              <Selection
                name="model"
                title="Model"
                placeholder="Model"
                fetchAPI={(e) => getModels(e)}
                optionLabelKey="name"
                onChange={(e) => {
                  setModel(e);
                  setOutputField(e && e.name);
                }}
                value={model}
                classes={{ root: styles.MuiAutocompleteRoot }}
              />
            ) : (
              <React.Fragment>
                {models?.length > 1 && (
                  <Selection
                    name="model"
                    title="Context model"
                    fetchAPI={() => getData()}
                    optionLabelKey="name"
                    onChange={(e) => {
                      if (!e) {
                        setMetaField(null);
                        setRelationalField(null);
                        setAllFields(null);
                      }
                      setContextModel(e);
                      setOutputField(null);
                    }}
                    value={contextModel}
                    classes={{ root: styles.MuiAutocompleteRoot }}
                  />
                )}
                <FieldEditor
                  getMetaFields={() => getMetaFields(contextModel)}
                  allowAllFields={true}
                  excludeUITypes={true}
                  onChange={(val, metaField, relationalField) => {
                    setOutputField(val);
                    setMetaField(metaField);
                    const values = val && val.split(".");
                    const newFields = [...(allFields || []), metaField];
                    const fields =
                      newFields &&
                      values &&
                      newFields.filter((f) => values.includes(f && f.name));
                    const isAvailable =
                      fields &&
                      relationalField &&
                      fields.find(
                        (f) => (f && f.name) === relationalField.name
                      );
                    if (isAvailable) {
                      setRelationalField(relationalField);
                    } else {
                      setRelationalField(null);
                    }
                    setAllFields(fields);
                  }}
                  value={{
                    fieldName: outputField || "",
                    allFields,
                  }}
                  isParent={true}
                />
              </React.Fragment>
            )}
          </Box>
        </DialogContent>
        <DialogFooter>
          <Button
            onClick={() => {
              handleOk();
              setModel(null);
              setOpenOutputExpression(false);
              const field =
                metaField ||
                (allFields?.length > 0 && allFields[allFields?.length - 1]);
              if (valueFrom === "model") {
                setProperty({ name: model?.name }, output);
              } else {
                setProperty({ name: field?.name }, output);
              }
            }}
            variant="primary"
            className={styles.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => {
              setOpenOutputExpression(false);
              setOutputField(null);
              setModel(null);
              setContextModel(null);
              setMetaField(null);
              setAllFields([]);
              setRelationalField(null);
            }}
            variant="secondary"
            className={styles.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogFooter>
      </Dialog>

      <TextField
        element={element}
        entry={{
          id: "name",
          label: translate("Output name"),
          modelProperty: "name",
          get: function () {
            return {
              name: output && output.name,
            };
          },
          set: function (e, values) {
            let currentVal = values["name"];
            setProperty({ name: currentVal }, output);
          },
        }}
        canRemove={true}
      />
      <SelectBox
        element={element}
        entry={{
          id: "typeRef",
          label: translate("Type"),
          modelProperty: "typeRef",
          selectOptions: TYPES,
          disabled: readOnly,
          get: function () {
            return { typeRef: type };
          },
          set: function (e, value) {
            let typeRef = value.typeRef;
            if (output) {
              setType(typeRef);
              setDefaultValue(null);

              setProperty(
                { typeRef, "camunda:defaultValue": undefined },
                output
              );
            }
          },
        }}
      />
      {["date", "time", "datetime"].includes(type) ? (
        <DatePicker
          type={type}
          entry={{
            id: "defaultValue",
            label: translate("Default value"),
            get: function () {
              return { defaultValue };
            },
            set: function (value) {
              setDefaultValue(value);
              setProperty({ "camunda:defaultValue": value }, output);
            },
          }}
        />
      ) : (
        <TextField
          element={element}
          entry={{
            id: "defaultValue",
            label: translate("Default value"),
            modelProperty: "defaultValue",
            get: function () {
              return { defaultValue };
            },
            set: function (e, values) {
              const currentVal = values["defaultValue"];
              const value =
                currentVal && type === "string"
                  ? `"${currentVal.replace(/['"]+/g, "")}"`
                  : currentVal;
              setDefaultValue(value);
              setProperty({ "camunda:defaultValue": value }, output);
            },
          }}
          canRemove={true}
        />
      )}

      <AlertDialog
        openAlert={openAlert}
        handleAlertOk={handleAlertOk}
        alertClose={alertClose}
        message="Script can't be managed using builder once changed manually."
        title="Warning"
      />
    </React.Fragment>
  );
}
