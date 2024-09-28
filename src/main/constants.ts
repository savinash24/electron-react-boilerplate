const constantsObject = {
  WIN_ROOT: 'documents',
  WIN_SUB_FOLDER: 'Facttwin charts',
  DATABASE_NAME: 'akriviaCharts.db'
};
export default {
  ...constantsObject,
  WIN_PATH: `${constantsObject.WIN_ROOT}/${constantsObject.WIN_SUB_FOLDER}`,
};
