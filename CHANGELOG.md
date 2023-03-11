# Changelog

## v0.2.5

- Support deep merging when merging _.shared.json and _.local.json pairs and use by default
- Add extension configuration option, `arrayMerge`, that allows users to control the merge behavior of array-type keys defined in both the _.shared.json and _.local.json files: either by deeply merging/combining the two array values, or utilize the prior behavior of just using the array from _.local.json/ignoring the overlapping key in _.shared.json
