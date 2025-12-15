package com.ogon.timetracker.rendererer;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class TimeTrackerRenderer {

    public static List<String> findByEmailAddr(String emails) {

        if (emails == null || emails.trim().isEmpty()) {
            return Collections.emptyList();
        }

        return Arrays.stream(emails.split(","))
                .map(String::trim)
                .filter(e -> !e.isEmpty())
                .collect(Collectors.toList());
    }

}
