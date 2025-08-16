
// Windows temporarily needs this file, https://github.com/module-federation/vite/issues/68

    const importMap = {
      
        "react": async () => {
          let pkg = await import("__mf__virtual/echarts__prebuild__react__prebuild__.js")
          return pkg
        }
      ,
        "@mui/material": async () => {
          let pkg = await import("__mf__virtual/echarts__prebuild___mf_0_mui_mf_1_material__prebuild__.js")
          return pkg
        }
      ,
        "@mui/icons-material": async () => {
          let pkg = await import("__mf__virtual/echarts__prebuild___mf_0_mui_mf_1_icons_mf_2_material__prebuild__.js")
          return pkg
        }
      ,
        "@iobroker/adapter-react-v5": async () => {
          let pkg = await import("__mf__virtual/echarts__prebuild___mf_0_iobroker_mf_1_adapter_mf_2_react_mf_2_v5__prebuild__.js")
          return pkg
        }
      ,
        "react-dom": async () => {
          let pkg = await import("__mf__virtual/echarts__prebuild__react_mf_2_dom__prebuild__.js")
          return pkg
        }
      
    }
      const usedShared = {
      
          "react": {
            name: "react",
            version: "18.3.1",
            scope: ["default"],
            loaded: false,
            from: "echarts",
            async get () {
              usedShared["react"].loaded = true
              const {"react": pkgDynamicImport} = importMap 
              const res = await pkgDynamicImport()
              const exportModule = {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*"
            }
          }
        ,
          "@mui/material": {
            name: "@mui/material",
            version: "6.5.0",
            scope: ["default"],
            loaded: false,
            from: "echarts",
            async get () {
              usedShared["@mui/material"].loaded = true
              const {"@mui/material": pkgDynamicImport} = importMap 
              const res = await pkgDynamicImport()
              const exportModule = {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*"
            }
          }
        ,
          "@mui/icons-material": {
            name: "@mui/icons-material",
            version: "6.5.0",
            scope: ["default"],
            loaded: false,
            from: "echarts",
            async get () {
              usedShared["@mui/icons-material"].loaded = true
              const {"@mui/icons-material": pkgDynamicImport} = importMap 
              const res = await pkgDynamicImport()
              const exportModule = {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*"
            }
          }
        ,
          "@iobroker/adapter-react-v5": {
            name: "@iobroker/adapter-react-v5",
            version: "7.7.2",
            scope: ["default"],
            loaded: false,
            from: "echarts",
            async get () {
              usedShared["@iobroker/adapter-react-v5"].loaded = true
              const {"@iobroker/adapter-react-v5": pkgDynamicImport} = importMap 
              const res = await pkgDynamicImport()
              const exportModule = {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*"
            }
          }
        ,
          "react-dom": {
            name: "react-dom",
            version: "18.3.1",
            scope: ["default"],
            loaded: false,
            from: "echarts",
            async get () {
              usedShared["react-dom"].loaded = true
              const {"react-dom": pkgDynamicImport} = importMap 
              const res = await pkgDynamicImport()
              const exportModule = {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "*"
            }
          }
        
    }
      const usedRemotes = [
      ]
      export {
        usedShared,
        usedRemotes
      }
      