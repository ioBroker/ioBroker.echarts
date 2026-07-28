// Module augmentation: adds the custom `grey` colour to MUI Buttons.
// Needs top-level `export {}` so the file counts as a module — `declare module` on an
// existing package is only an augmentation inside a module.
import '@mui/material/Button';

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}

export {};
