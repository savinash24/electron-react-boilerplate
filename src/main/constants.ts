const constantsObject = {
  WIN_ROOT: 'Documents',
  WIN_SUB_FOLDER: 'Facttwin charts',
  DATABASE_NAME: 'akriviaCharts.db'
};
export default {
  ...constantsObject,
  WIN_FOLDER: `${constantsObject.WIN_ROOT}/${constantsObject.WIN_SUB_FOLDER}`,
};
