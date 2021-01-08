import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, FormControl, Select, InputLabel, MenuItem, TextField, Button,
} from '@material-ui/core';
import {
  complex,
  Complex,
  add,
  multiply,
  pow,
} from 'mathjs';
import { Formik } from 'formik';
import * as yup from 'yup';

enum LineTypes {
  SHORT,
  MEDIUM_PI,
  MEDIUM_T,
}

interface Form {
  voltage: number;
  voltageImaginary: number;
  current: number;
  currentImaginary: number;
  lineType: LineTypes;
  resistance: number;
  capacitance: number;
  inductance: number;
}

const validationSchema = yup.object({
  voltage: yup.number().required(),
  current: yup.number().required(),
  lineType: yup.mixed().oneOf(Object.values(LineTypes)).required(),
  capacitance: yup.number().required(),
  inductance: yup.number().required(),
});

const initialValues: Form = {
  voltage: 1,
  voltageImaginary: 1,
  current: 1,
  currentImaginary: 1,
  lineType: LineTypes.SHORT,
  resistance: 1,
  capacitance: 1,
  inductance: 1,
};

interface Coefficients {
  a: Complex;
  b: Complex;
  c: Complex;
  d: Complex;
}

interface Outputs {
  vs: Complex;
  is: Complex;
}

const calculateZ = (values: Form) => {
  return complex(values.resistance, 50 * values.inductance);
}

const calculateDelta = (values: Form) => {
  return complex(0, 50 * values.capacitance);
}

const calculateCoefficients = (values: Form): Coefficients => {
  if (values.lineType === LineTypes.SHORT) {
    return {
      a: complex(1, 0),
      b: calculateZ(values),
      c: complex(0, 0),
      d: complex(1, 0),
    };
  }
  if (values.lineType === LineTypes.MEDIUM_PI) {
    return {
      a: add(1,
        multiply(
          multiply(
            calculateZ(values),
            calculateDelta(values),
          ),
          1 / 2,
        ),
      ) as any,
      b: calculateZ(values),
      c: multiply(
        calculateDelta(values),
        add(
          1,
          multiply(
            multiply(
              calculateZ(values),
              calculateDelta(values),
            ),
            1 / 4
          ),
        ),
      ) as any,
      d: add(1,
        multiply(
          multiply(
            calculateZ(values),
            calculateDelta(values),
          ),
          1 / 2,
        ),
      ) as any,
    };
  }
  return {
    a: add(1,
      multiply(
        multiply(
          calculateZ(values),
          calculateDelta(values),
        ),
        1 / 2,
      ),
    ) as any,
    b: multiply(
      calculateZ(values),
      add(
        1,
        multiply(
          multiply(
            calculateZ(values),
            calculateDelta(values),
          ),
          1 / 4
        ),
      ),
    ) as any,
    c: calculateDelta(values),
    d: add(1,
      multiply(
        multiply(
          calculateZ(values),
          calculateDelta(values),
        ),
        1 / 2,
      ),
    ) as any,
  }
};

const calculatePowerLoss = (values: Form, Is: Complex): Complex => {
  if (values.lineType === LineTypes.SHORT) {
    return multiply(
      pow(Is, 2),
      values.resistance,
    ) as any;
  }
  if (values.lineType === LineTypes.MEDIUM_PI) {
    return multiply(
      pow(
        add(
          multiply(
            calculateDelta(values), 1 / 2),
          complex(values.current, values.currentImaginary)
        ),
        2,
      ),
      values.resistance,
    ) as any;
  }
  return multiply(
    add(
      pow(Is, 2),
      pow(complex(values.current, values.currentImaginary), 2),
    ),
    values.resistance / 2,
  ) as any;
}

function App() {
  const [output, setOutput] = useState('');
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card>
        <CardHeader title="Inputs" />
        <CardContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(data) => {
              const coeffs = calculateCoefficients(data);
              const Vs = add(
                multiply(
                  coeffs.a,
                  complex(data.current, data.currentImaginary),
                ),
                multiply(
                  coeffs.b,
                  complex(data.voltage, data.voltageImaginary),
                ),
              );
              const Is = add(
                multiply(
                  coeffs.c,
                  complex(data.current, data.currentImaginary),
                ),
                multiply(
                  coeffs.d,
                  complex(data.voltage, data.voltageImaginary),
                ),
              ) as any;
              const Pl = calculatePowerLoss(data, Is);
              console.log(
                ...Object.values(coeffs).map(val => val.toString()),
                Vs.toString(),
                Is.toString(),
                Pl.toString(),
              );
              setOutput(
                `A: ${coeffs.a.toString()}\n`
                + `B: ${coeffs.b.toString()}\n`
                + `C: ${coeffs.c.toString()}\n`
                + `D: ${coeffs.d.toString()}\n`
                + `Vs: ${Vs.toString()}\n`
                + `Is: ${Is.toString()}\n`
                + `Pl: ${Pl.toString()}`
              )
            }}
          >
            {
              ({ handleChange, values, touched, errors, setFieldTouched, handleSubmit }) => (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'stretch',
                    }}
                  >
                    <FormControl
                      style={{
                        flex: 1,
                      }}
                    >
                      <TextField
                        id="voltage"
                        name="voltage"
                        label="Voltage Real"
                        value={values.voltage}
                        onChange={handleChange}
                        inputMode="numeric"
                        type="number"
                        error={touched.voltage && Boolean(errors.voltage)}
                        onBlur={() => setFieldTouched('voltage', true)}
                        helperText={touched.voltage && errors.voltage}
                      />
                    </FormControl>
                    <FormControl
                      style={{
                        flex: 1,
                      }}
                    >
                      <TextField
                        id="voltageImaginary"
                        name="voltageImaginary"
                        label="Voltage Imaginary"
                        value={values.voltageImaginary}
                        onChange={handleChange}
                        inputMode="numeric"
                        type="number"
                        error={touched.voltageImaginary && Boolean(errors.voltageImaginary)}
                        onBlur={() => setFieldTouched('voltageImaginary', true)}
                        helperText={touched.voltageImaginary && errors.voltageImaginary}
                      />
                    </FormControl>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'stretch',
                    }}
                  >

                    <FormControl
                      style={{
                        flex: 1,
                      }}
                    >
                      <TextField
                        id="current"
                        name="current"
                        label="Current Real"
                        value={values.current}
                        onChange={handleChange}
                        inputMode="numeric"
                        type="number"
                        error={touched.current && Boolean(errors.current)}
                        onBlur={() => setFieldTouched('current', true)}
                        helperText={touched.current && errors.current}
                      />
                    </FormControl>
                    <FormControl
                      style={{
                        flex: 1,
                      }}
                    >
                      <TextField
                        id="currentImaginary"
                        name="currentImaginary"
                        label="Current Imaginary"
                        value={values.currentImaginary}
                        onChange={handleChange}
                        inputMode="numeric"
                        type="number"
                        error={touched.currentImaginary && Boolean(errors.currentImaginary)}
                        onBlur={() => setFieldTouched('currentImaginary', true)}
                        helperText={touched.currentImaginary && errors.currentImaginary}
                      />
                    </FormControl>
                  </div>
                  <FormControl>
                    <InputLabel id="lineTypeLabel">Transmission line type</InputLabel>
                    <Select error={touched.lineType && Boolean(errors.lineType)} id="lineType" name="lineType" labelId="lineTypeLabel" value={values.lineType} onChange={handleChange}>
                      <MenuItem value={LineTypes.SHORT}>Short</MenuItem>
                      <MenuItem value={LineTypes.MEDIUM_PI}>Medium Pi</MenuItem>
                      <MenuItem value={LineTypes.MEDIUM_T}>Medium T</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <TextField
                      id="resistance"
                      name="resistance"
                      label="Resistance"
                      value={values.resistance}
                      onChange={handleChange}
                      inputMode="numeric"
                      type="number"
                      error={touched.resistance && Boolean(errors.resistance)}
                      onBlur={() => setFieldTouched('resistance', true)}
                      helperText={touched.resistance && errors.resistance}
                    />
                  </FormControl>
                  <FormControl>
                    <TextField
                      id="capacitance"
                      name="capacitance"
                      label="Capacitance"
                      value={values.capacitance}
                      onChange={handleChange}
                      inputMode="numeric"
                      type="number"
                      error={touched.capacitance && Boolean(errors.capacitance)}
                      onBlur={() => setFieldTouched('capacitance', true)}
                      helperText={touched.capacitance && errors.capacitance}
                    />
                  </FormControl>
                  <FormControl>
                    <TextField
                      id="inductance"
                      name="inductance"
                      label="Inductance"
                      value={values.inductance}
                      onChange={handleChange}
                      inputMode="numeric"
                      type="number"
                      error={touched.inductance && Boolean(errors.inductance)}
                      onBlur={() => setFieldTouched('inductance', true)}
                      helperText={touched.inductance && errors.inductance}
                    />
                  </FormControl>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={() => handleSubmit()}
                  >Calculate</Button>
                </>
              )
            }
          </Formik>
        </CardContent>
      </Card>
      {
        !!output && (
          <Card>
            <CardHeader title="Output" />
            <CardContent>
              <p>
                {output.split('\n').map((str) => (
                  <>
                    {str}
                    <br />
                  </>
                ))}
              </p>
            </CardContent>
          </Card>
        )
      }
    </div>
  );
}

export default App;
