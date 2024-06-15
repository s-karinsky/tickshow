export const themeConfig = {
  token: {
    activeBg: "#2C2C2B",
    activeBorderColor: "red",
    activeShadow: "0px 3px 6px 0px rgba(140, 149, 159, 0.15)",
    hoverBorderColor: "green",
    colorBgElevated: "#2C2C2B",
    colorBorder: "transparent",
    cellHoverBg: "#2C2C2B",
    colorPrimary: "#787aff",
    cellActiveWithRangeBg: "#222",
    colorBgContainer: "#2C2C2B",
  },
  components: {
    Select: {
      fontSizeIcon: 10,
      optionActiveBg: "#555",
      optionSelectedBg: "#555",
      zIndexPopup: 9999,
    },
    Notification: {
      zIndexPopup: 9999,
    },
    Segmented: {
      itemSelectedBg: "#444",
      trackBg: "#333",
    },
    Dropdown: {
      zIndexPopup: 9999,
      paddingBlock: 1,
    },
    Tag: {
      borderRadiusSM: 10,
    },
    Checkbox: {
      colorPrimary: "#aaa",
      colorBorder: "#aaa",
      colorPrimaryBorder: "#aaa",
      colorPrimaryHover: "#aaa",
    },
  },
};
